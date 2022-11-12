import {catchError, expand, map, Observable, of, scan, shareReplay, tap} from 'rxjs'
import {ApiClient, PREFIX_REST} from './api/ApiClient'
import {ajax} from 'rxjs/internal/ajax/ajax'
import {MatrixEvent, MessageEventContent, RoomMessagesResponse, StateEvent, SyncResponse} from './types/Api'

import {Omnibus} from 'omnibus-rxjs'
import {getIncrementalFilter, getInitialFilter} from './sync-filter'
import RestClient from './api/RestClient'
import {Credentials} from './types/Credentials'
import {buildRoomHierarchy, extractRoomsInfo, InternalAugmentedRoom, mergeNestedRooms, RoomHierarchyData} from './room'
import {RoomSubject} from './room/subject'

const syncTimeout = 10000

interface LoginParams {
    userId: any;
    password: any;
    server: string
}

export async function login(params: LoginParams) {
    return await new ApiClient().login(params.userId, params.password, params.server)
}

interface LoadHistoricEventsParams {
    roomId: string
    from: string
    to?: string
    direction?: 'b' | 'f'
    limit?: string
}

export class Matrix {
    static async fromUserAndPassword(params: LoginParams): Promise<Matrix> {
        return Matrix.fromCredentials(await login(params))
    }

    static fromCredentials(creds: Credentials): Matrix {
        return new Matrix(creds, new RestClient(creds.accessToken, creds.homeServer, PREFIX_REST))
    }

    constructor(
        private credentials: Credentials,
        private restClient: RestClient,
        private serverUrl: string = `https://matrix-client.matrix.org`,
    ) {
    }

    // todo probably by default get very generic info about rooms - no messages
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

            return ajax.getJSON(`${this.serverUrl}${PREFIX_REST}sync?` + params.toString())
        }

        // todo add retry
        return callSync().pipe(expand(r => callSync(r.next_batch)))
    }

    loadHistoricEvents(
        {
            roomId,
            from,
            to,
            direction = 'b',
            limit = '100',
        }: LoadHistoricEventsParams,
    ): Observable<Pick<InternalAugmentedRoom, '_rawEvents' | 'gaps'>> {
        const params = new URLSearchParams({
            from: from,
            dir: direction,
            limit, // todo make this configurable
            access_token: this.credentials.accessToken,
        })
        if (to) {
            params.set('to', to)
        }

        // todo handle `from` being empty

        return ajax.getJSON<RoomMessagesResponse>(`${this.serverUrl}${PREFIX_REST}rooms/${roomId}/messages?` + params.toString())
            .pipe(
                tap(it => console.log('scroll-response', it)),
                map(it => ({
                    _rawEvents: it.chunk,
                    gaps: {
                        back: {
                            token: it.end,
                            timestamp: it.chunk[0].origin_server_ts,
                        }
                    },
                })),
            )
    }

    room(roomId: string): RoomSubject {
        return new RoomSubject(roomId, this)
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
}
