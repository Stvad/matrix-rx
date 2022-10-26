import {BehaviorSubject, catchError, expand, map, merge, mergeMap, Observable, of, scan, shareReplay, tap} from 'rxjs'
import {ApiClient, PREFIX_REST} from './api/ApiClient'
import {ajax} from 'rxjs/internal/ajax/ajax'
import {
    MatrixEvent,
    MessageEventContent,
    MessageEventType,
    ReplaceEvent,
    RoomData,
    RoomMessagesResponse,
    RoomNameEvent,
    SyncResponse,
} from './types/Api'

import {Omnibus} from 'omnibus-rxjs'
import {getIncrementalFilter, getInitialFilter} from './sync-filter'
import RestClient from './api/RestClient'
import {Credentials} from './types/Credentials'

const matrixEventBus = new Omnibus<MatrixEvent>()
const controlBus = new Omnibus()

interface Room extends RoomData {
    id: string
    events: MatrixEvent[]
    name: string
    backPaginationToken: string
}

const syncTimeout = 10000

function extractCoreRoomsInfo(rooms: { [id: string]: RoomData }): { [id: string]: Room } {
    function getRoomName(events: MatrixEvent[]) {
        // @ts-ignore https://github.com/microsoft/TypeScript/issues/48829
        const nameEvent = events.findLast(e => e.type === 'm.room.name') as RoomNameEvent | undefined
        return nameEvent?.content.name ?? ''
    }

    function extractRoomInfo(id: string) {
        const room = rooms[id]
        // todo members
        const loadedRoomEvents = [...room.state.events, ...room.timeline.events]
        return {
            id,
            events: loadedRoomEvents,
            name: getRoomName(loadedRoomEvents),
            /** todo
             * the story is more complicated, can have windows of unloaded messages, etc
             */
            backPaginationToken: room.timeline.prev_batch,
            ...room,
        }
    }

    return Object.fromEntries(Object.keys(rooms).map(it => [it, extractRoomInfo(it)]))
}

const hasRelationships = (event: MatrixEvent) => event.content['m.relates_to']

const getEventsWithRelationships = (events: MatrixEvent[]) => events.filter(hasRelationships)
const getRootEvents = (events: MatrixEvent[]) => events.filter(it => !hasRelationships(it))

function emitEvents(events: MatrixEvent[]) {
    // todo
    // solution for timeouts is probs for the event observable be "rememberLast" by default
    // though if nobody is subscribed it will still not help.
    // I almost want to supply a default value to the observable, which should be possible
    // bind does this.
    // but that's not sufficient for relations - if I emit relations and nobody is subscribed - they just fall through
    // less observable and more queue?

    events?.forEach(it => matrixEventBus.trigger(it))
}

function isThreadChildOf(threaded: MatrixEvent, root: MatrixEvent) {
    const threadTypes = ['m.thread', 'm.glue-thread']

    return threadTypes.includes(threaded.content['m.relates_to']?.rel_type!) &&
        threaded.content['m.relates_to']?.event_id === root.event_id
}

interface ObservedEvent {
    id: string,
    timestamp: number,
    type: MessageEventType,
    observable: Observable<MatrixEvent>,
}

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

interface LoginParams { userId: any; password: any; server: string }

export async function login(params: LoginParams) {
    return await new ApiClient().login(params.userId, params.password, params.server)
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
        private credentials: any,
        private restClient: RestClient,
        private serverUrl: string = `https://matrix-client.matrix.org`) {
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

    observedEvent(event: MatrixEvent, observable?: Observable<MatrixEvent>): ObservedEvent {
        return {
            id: event.event_id,
            timestamp: event.origin_server_ts,
            type: event.type,
            observable: observable || this.event(event.event_id, event),
        }
    }

    scroll(roomId: string, from: string, to?: string): Observable<{ events: MatrixEvent[] }> {
        const params = new URLSearchParams({
            from: from,
            dir: 'b',
            limit: '100', // todo make this configurable
            access_token: this.credentials.accessToken,
        })
        if (to) {
            params.set('to', to)
        }

        // todo handle `from` being empty

        return ajax.getJSON<RoomMessagesResponse>(`${this.serverUrl}${PREFIX_REST}rooms/${roomId}/messages?` + params.toString())
            .pipe(
                tap(it => console.log('scroll-response', it)),
                map(it => ({events: it.chunk, backPaginationToken: it.end})),
            )
    }

    scrollOnTrigger(roomId: string) {
        return controlBus.query((it => it.type === 'scroll' && it.roomId === roomId))
            .pipe(
                tap(it => console.log('scrolling', it)),
                mergeMap((it) => this.scroll(roomId, it.from, it.to)),
            )
    }

    triggerScroll(roomId: string, from: string, to?: string) {
        controlBus.trigger({type: 'scroll', roomId, from, to})
    }

    room(roomId: string): Observable<RoomData> {
        const roomFromSync = this.sync(roomId).pipe(
            tap(console.log),
            map(it => it.rooms?.join ?? {}),
            map(extractCoreRoomsInfo),
            map(it => it[roomId]))


        return merge(roomFromSync, this.scrollOnTrigger(roomId)).pipe(
            map(it => {
                if (!it?.events) return it

                const rootEventsObservables = getRootEvents(it.events).map(it => this.observedEvent(it))
                this.addToRegistry(rootEventsObservables)

                const eventsWithRelationshipsObservable =
                    getEventsWithRelationships(it.events).map(it => this.observedEvent(it))
                this.addToRegistry(eventsWithRelationshipsObservable)

                if (it?.events) emitEvents(it.events)

                /**
                 * right now second+ order relations are dropped
                 * (e.g. edit a message in a thread)
                 * bc. there is no listener for it either on top or "relates to" level
                 *
                 * should I create those observables for all events, and then retrieve them by id when needed?
                 * - this is probably ok, maybe avoiding some obviously "leaf" events
                 * - for server supported relations - it seems that the server will include some relations inthe root event
                 *   - not clear if it's part of the spec/will there be all events/etc
                 *   - also probably prevents from supporting custom relations?
                 *   - see https://spec.matrix.org/v1.3/client-server-api/#aggregations
                 *     - it seems for threads it'd include just the latest event, which is not very useful
                 *     - for reactions it'd include all reactions, which can be used to assemble the event faster
                 * other option is to re-emit events that were not consumed by anyone, but that probably would go bad places
                 *
                 */

                return {
                    ...it,
                    events: rootEventsObservables,
                }
            }),
            scan((acc, curr = {events: []}) => {
                // Don't do new data synthesis in scan, bc then new data is only available on the second+ batch of events
                return {
                    ...acc,
                    ...curr,
                    // todo performance wise - should be able to just do merge part of merge sort instead of full sort
                    // todo dedup, though maybe even at an earlier stage (observable creation)
                    events: [...acc.events, ...curr.events].sort((a, b) => a.timestamp - b.timestamp),
                }
            }),
            map(it => ({
                ...it,
                messages: it.events.filter(it => it.type === 'm.room.message'),
            })),
            shareReplay(1),

            catchError(error => {
                console.log('error: ', error)
                return of(error)
            }),
        )
    }

    private addToRegistry(eventObservables: { observable: Observable<MatrixEvent>; id: string }[]) {
        eventObservables.forEach(it => this.observableRegistry.set(it.id, it.observable))
    }

    roomList(): Observable<Room[]> {
        return this.sync().pipe(
            map(it => it.rooms?.join ?? {}),
            map(extractCoreRoomsInfo),
            scan((acc, curr) => {
                return {...acc, ...curr}
            }),
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

        const rawEvent$ = matrixEventBus.query(eventOfInterest).pipe(
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
}
