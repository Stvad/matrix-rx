import {BehaviorSubject, catchError, expand, map, Observable, of, scan, shareReplay, tap} from 'rxjs'
import {ApiClient, PREFIX_REST} from './api/ApiClient'
import {ajax} from 'rxjs/internal/ajax/ajax'
import {
    MatrixEvent,
    MessageEventContent,
    ReplaceEvent,
    RoomMessagesResponse,
    StateEvent,
    SyncResponse,
} from './types/Api'

import {Omnibus} from 'omnibus-rxjs'
import {getIncrementalFilter, getInitialFilter} from './sync-filter'
import RestClient from './api/RestClient'
import {Credentials} from './types/Credentials'
import {AugmentedRoomData, buildRoomHierarchy, extractRoomsInfo, mergeNestedRooms} from './room'
import {isThreadChildOf, ObservedEvent} from './event'
import {RoomSubject} from './room/subject'

const syncTimeout = 10000

const toBehaviorSubject = <T>(observable: Observable<T>, initialValue: T) => {
    /**
     * todo unsubscribe/release resources procedure
     * because we are creating a subscription here - the observable will stay "hot"
     * till we unsubscribe from
     * so likely here  I have a resource leak
     *
     * potential interesting avenue - use `takeWhile` or `takeUntil` to unsubscribe
     * relying on the status of the room observable
     *
     * tho also good to think about messages that haven't been viewed for a while 🤔
     *
     */

    const subject = new BehaviorSubject(initialValue)
    observable.subscribe(subject)
    return subject
}

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

    /**
     * kind of unhappy with having to have this, is there a bette way?
     */
    private observableRegistry = new Map<string, Observable<MatrixEvent>>()

    constructor(
        private credentials: Credentials,
        private restClient: RestClient,
        private serverUrl: string = `https://matrix-client.matrix.org`,
        public matrixEventBus: Omnibus<MatrixEvent> = new Omnibus(),
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

    observedEvent(event: MatrixEvent, observable?: Observable<MatrixEvent>): ObservedEvent {
        return {
            id: event.event_id,
            timestamp: event.origin_server_ts,
            type: event.type,
            observable: observable || this.event(event.event_id, event),
        }
    }

    loadHistoricEvents(
        {
            roomId,
            from,
            to,
            direction = 'b',
            limit = '100',
        }: LoadHistoricEventsParams,
    ): Observable<Partial<AugmentedRoomData>> {
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
                    events: it.chunk,
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
        return new RoomSubject(roomId, this, this.matrixEventBus)
    }

    roomList(): Observable<AugmentedRoomData[]> {
        return this.sync().pipe(
            map(it => it.rooms?.join ?? {}),
            map(extractRoomsInfo),
            scan(mergeNestedRooms),
            map(buildRoomHierarchy),
            shareReplay(1),

            catchError(error => {
                console.log('error: ', error)
                return of(error)
            }),
        )
    }

    event(eventId: string, init: MatrixEvent): Observable<MatrixEvent> {
        const mergeReplaceEvent = (event: MatrixEvent, edit: MatrixEvent) => {
            const isReplaceEvent = (ev: MatrixEvent): ev is ReplaceEvent =>
                ev.content['m.relates_to']?.rel_type === 'm.replace'

            if (!isReplaceEvent(edit)) return event

            return {
                ...event,
                content: {
                    ...event.content,
                    ...edit.content['m.new_content'],
                },
                edited: true,
            }
        }

        const mergeThreadEvent = (root: MatrixEvent, threaded: MatrixEvent) => {
            if (!isThreadChildOf(threaded, root)) return root

            return {
                ...root,
                children: [
                    ...(root.children ?? []),
                    this.observedEvent(threaded, this.observableRegistry.get(threaded.event_id)),
                ],
                threadRoot: true,
            }
        }

        const eventOfInterest = (it: MatrixEvent) => {
            const unprocessedRelationship = it.content['m.relates_to']?.event_id === eventId && !it.processedAsChild
            return it.event_id === eventId || unprocessedRelationship
        }

        const rawEvent$ = this.matrixEventBus.query(eventOfInterest).pipe(
            tap(it => console.log(it.event_id === eventId ? 'match on id' : 'match on rel')),
            scan((acc, curr) => {
                if (acc.event_id === curr.event_id) {
                    // todo why?
                    console.log('getting duplicate events 🤔')
                    return acc
                }
                const edited = mergeReplaceEvent(acc, curr)
                return mergeThreadEvent(edited, curr)
            }),
        )

        return toBehaviorSubject(rawEvent$, init)
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
