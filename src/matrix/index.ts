import {catchError, EMPTY, expand, from, map, mergeMap, Observable, of, reduce, scan, shareReplay, tap} from 'rxjs'
import {ApiClient, PREFIX_REST} from './api/ApiClient'
import {ajax, AjaxCreationMethod} from 'rxjs/internal/ajax/ajax'
import {
    EventsFilter,
    MatrixEvent,
    MessageEventContent,
    RoomMessagesResponse,
    StateEvent,
    SyncResponse,
} from './types/Api'
import {getIncrementalFilter, getInitialFilter} from './sync-filter'
import RestClient from './api/RestClient'
import {Credentials} from './types/Credentials'
import {buildRoomHierarchy, extractRoomsInfo, mergeNestedRooms} from './room/utils'
import {RoomHierarchyData, RoomSubject} from './room'

const syncTimeout = 10000

interface LoginParams {
    userId: string
    password: string
    server: string
}

export async function login(params: LoginParams) {
    return await new ApiClient().login(params.userId, params.password, params.server)
}

export interface LoadEventsParams {
    roomId: string
    from?: string
    direction: 'b' | 'f'
    to?: string
    limit?: string
    filter?: EventsFilter
}

export class Matrix {
    static async fromUserAndPassword(params: LoginParams): Promise<Matrix> {
        return Matrix.fromCredentials(await login(params))
    }

    static fromCredentials(creds: Credentials): Matrix {
        return new Matrix(creds)
    }

    constructor(
        private credentials: Credentials,
        private restrx: AjaxCreationMethod = ajax,
        private restClient: RestClient = new RestClient(credentials.accessToken, credentials.homeServer, PREFIX_REST),
        private baseUrl: string = `https://${credentials.homeServer}${PREFIX_REST}`,
    ) {
    }

    // todo probably by default get very generic info about rooms - no messages
    // todo make filter a parameter
    sync(roomId?: string): Observable<SyncResponse> {
        const callSync = (syncToken?: string): Observable<SyncResponse> => {
            const filter = syncToken ? getIncrementalFilter(roomId) : getInitialFilter(roomId)

            const params = new URLSearchParams({
                timeout: syncTimeout.toString(),
                filter: JSON.stringify(filter),
                full_state: 'true',
                set_presence: 'online',
                access_token: this.credentials.accessToken,

                ...(syncToken ? {
                    since: syncToken,
                    full_state: 'false',
                } : {}),
            })

            return this.restrx.getJSON(`${this.baseUrl}sync?` + params.toString())
        }
        /**
         * todo handle 'gaps' in the timeline
         * https://spec.matrix.org/v1.4/client-server-api/#:~:text=%E2%80%9Climited%E2%80%9D%20timeline%20is%20returned%2C%20containing%20only%20the%20most%20recent%20message%20events.%20a%20state%20%E2%80%9Cdelta%E2%80%9D%20is%20also%20returned%2C%20summarising%20any%20state%20changes%20in%20the%20omitted%20part%20of%20the%20timeline.%20the%20client%20may%20therefore%20end%20up%20with%20%E2%80%9Cgaps
         */

        // todo add retry
        return callSync().pipe(expand(r => callSync(r.next_batch)))
    }

    loadEventBatch(
        {
            roomId,
            from,
            to,
            direction,
            limit = '100',
            filter = {},
        }: LoadEventsParams,
    ): Observable<RoomMessagesResponse> {
        const params = new URLSearchParams({
            dir: direction,
            limit,
            access_token: this.credentials.accessToken,
            filter: JSON.stringify(filter),
            ...to && {to},
            ...from && {from},
        })

        if (!from) {
            console.warn('from is empty, are you sure you want to load events from the start of history?')
        }

        return this.restrx.getJSON<RoomMessagesResponse>(`${this.baseUrl}rooms/${roomId}/messages?` + params.toString())
            .pipe(tap(it => console.log('load-event-batch-response', it)))
    }

    loadEvents(params: LoadEventsParams): Observable<RoomMessagesResponse> {
        /**
         * b [3 2 1] [6 5 4]
         * f [1 2 3] [4 5 6]
         */
        const mergeEvents = (acc: MatrixEvent[], curr: MatrixEvent[]) =>
            params.direction === 'f' ? [...acc, ...curr] : [...curr, ...acc]

        return this.loadEventBatch(params).pipe(
            expand((r): Observable<RoomMessagesResponse> => {
                if (!r.end) return EMPTY
                return this.loadEventBatch({
                    ...params,
                    from: r.end,
                })
            }),
            /**
             * one wonders if maybe you want to return
             * an observable of events instead of waiting to merge all first
             * def better for large chunks of data
             */
            reduce((acc, curr) => ({
                chunk: mergeEvents(acc.chunk, curr.chunk),
                state: mergeEvents(acc.state ?? [], curr.state ?? []),
                start: curr.start,
            })),
            // todo make sure this works with just one chunk
        )
    }

    /**
     * todo. this rn includes the "since" event, which is at best questionable
     * "since" implies after. but presumably can have that be a param. probably should filter it out by default 🤔
     *
     * ----
     * this can also be optimized a bit by starting from "end" and reusing the events returned in the context for the result
     */
    loadEventsSince(roomId: string, eventId: string): Observable<RoomMessagesResponse> {
        return from(this.getEventContext(roomId, eventId, {limit: 1}))
            .pipe(mergeMap(it => this.loadEvents({
                roomId,
                from: it.start,
                direction: 'f',
            })))
    }

    room(roomId: string, sinceEventId?: string): RoomSubject {
        return new RoomSubject({id: roomId, matrix: this, sinceEventId})
    }

    roomList(): Observable<RoomHierarchyData[]> {
        return this.sync().pipe(
            map(it => it.rooms?.join ?? {}),
            map(extractRoomsInfo),
            scan(mergeNestedRooms),
            map(buildRoomHierarchy),
            shareReplay(1),

            // todo
            catchError(error => {
                console.log('room li error: ', error)
                return of(error)
            }),
        )
    }

    /**
     * This is right now not really in the paradigm of the rest of the client,
     * need to reflect if there is a better way
     *
     * at the least I can use the ajax.put & return an observable for interface consistency
     * not sure if that actually provides much benefit?
     * cancellation is one potential benefit
     *
     * also maybe when I think about the buffer of sending messages - that can be an observable returning a local state,
     * transitioning to a remote state
     */
    sendMessage(roomId: string, message: MessageEventContent) {
        const transactionId = 'text' + new Date()
        return this.restClient.sendMessage(roomId, message, transactionId)
    }

    sendStateEvent(
        roomId: string,
        stateEvent: StateEvent,
    ) {
        return this.restClient.sendStateEvent(roomId, stateEvent.type, stateEvent.content, stateEvent.stateKey)
    }

    getEventContext(
        roomId: string,
        eventId: string,
        params: { limit?: number, filter?: EventsFilter } = {},
    ) {
        // todo make return observable
        return this.restClient.getEventContext(roomId, eventId, params)
    }
}
