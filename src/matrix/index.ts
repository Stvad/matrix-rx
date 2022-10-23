import {BehaviorSubject, catchError, expand, map, mergeScan, multicast, Observable, of, scan, tap} from 'rxjs'
import {ApiClient, PREFIX_REST} from './api/ApiClient'
import {ajax} from 'rxjs/internal/ajax/ajax'
import {
    EventsFilter_,
    MatrixEvent,
    MessageEventType,
    RoomData,
    RoomFilter,
    RoomNameEvent,
    SyncFilter,
    SyncResponse,
} from './types/Api'

import {Omnibus} from 'omnibus-rxjs'
import {bind} from '@react-rxjs/core'

const bus = new Omnibus<MatrixEvent>()

// bus.listen(()=> true, console.log)

interface Room {
}

export const MESSAGE_COUNT_INC = 100
const syncTimeout = 10000

const roomEventTypesToLoad: MessageEventType[] = [
    'm.room.third_party_invite',
    'm.room.redaction',
    'm.room.message',
    'm.room.member',
    'm.room.name',
    'm.room.avatar',
    'm.room.canonical_alias',
    'm.room.join_rules',
    'm.room.power_levels',
    'm.room.topic',
    'm.room.encrypted',
    'm.room.create',
]

function getIncrementalFilter(roomId?: string) {

    const accountFilterRoom: EventsFilter_ = {
        limit: 0,
        types: [],
    }

    const roomFilter: RoomFilter = {
        rooms: roomId ? [roomId] : undefined,
        timeline: {
            limit: MESSAGE_COUNT_INC,
            lazy_load_members: true,
            types: roomEventTypesToLoad,
        },
        state: {
            lazy_load_members: true,
            types: [
                'm.room.member',
                'm.room.name',
                'm.room.avatar',
                'm.room.canonical_alias',
                'm.room.join_rules',
                'm.room.power_levels',
                'm.room.topic',
                'm.room.create',
            ],
        },
        ephemeral: {
            lazy_load_members: true,
            types: ['m.receipt'],
        },
        include_leave: true,
        account_data: accountFilterRoom,
    }

    const accountFilter: EventsFilter_ = {
        types: ['m.direct'],
    }

    const filter: SyncFilter = {
        room: roomFilter,
        account_data: accountFilter,
        presence: {types: ['m.presence']},
    }
    return filter
}

function getInitialFilter(roomId?: string) {
    const accountFilterRoom_: EventsFilter_ = {
        limit: 0,
        types: [],
    }

    const roomFilter_: RoomFilter = {
        rooms: roomId ? [roomId] : undefined,
        timeline: {
            limit: roomId ? 15 : 0,
            types: roomId ? roomEventTypesToLoad : [],
        },
        state: {
            lazy_load_members: true,
            types: [
                'm.room.third_party_invite',
                'm.room.member',
                'm.room.name',
                'm.room.avatar',
                'm.room.canonical_alias',
                'm.room.join_rules',
                'm.room.power_levels',
                'm.room.topic',
                'm.room.create',
            ],
        },
        ephemeral: {
            limit: 0,
            types: [],
        },
        include_leave: false,
        account_data: accountFilterRoom_,
    }

    const accountFilter_: EventsFilter_ = {
        types: ['m.direct', 'm.push_rules'],
    }

    const filter_: SyncFilter = {
        room: roomFilter_,
        account_data: accountFilter_,
        presence: {types: ['m.presence']},
    }
    return filter_
}

function extractCoreRoomsInfo(rooms: { [id: string]: RoomData }) {
    function getRoomName(events: MatrixEvent[]) {
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
        }
    }

    return Object.fromEntries(Object.keys(rooms).map(it => [it, extractRoomInfo(it)]))
}

const hasRelationships = (event: MatrixEvent) => event.content['m.relates_to']

const getEventsWithRelationships = (events: MatrixEvent[]) => events.filter(hasRelationships)
const getRootEvents = (events: MatrixEvent[]) => events.filter(it => !hasRelationships(it))

function emitEvents(events: MatrixEvent[]) {
    // todo timeot thing is very bad
    // solution for timeouts is probs for the event observable be "rememberLast" by default
    // though if nobody is subscribed it will still not help.
    // I almost want to supply a default value to the observable, which should be possible
    // bind does this.
    // but that's not sufficient for relations - if I emit relations and nobody is subscribed - they just fall through
    // less observable and more queue?

    events?.forEach(it => bus.trigger(it))
    // setTimeout(() => events?.forEach(it => bus.trigger(it)), 0)

    // setTimeout(() => getRootEvents(events).forEach(it => bus.trigger(it)), 100)
    // setTimeout(() => getEventsWithRelationships(events).forEach(it => bus.trigger(it)), 100)
    // getEventsWithRelationships(events)
}

function isThreadChildOf(threaded: MatrixEvent, root: MatrixEvent) {
    return threaded.content['m.relates_to']?.rel_type === 'm.thread' &&
        threaded.content['m.relates_to']?.event_id === root.event_id
}

export class Matrix {
    constructor(
        private credentials: any,
        private serverUrl: string = `https://matrix-client.matrix.org`) {
    }

    // todo probably by default get very generic info about rooms - ne messages
    sync(roomId?: string): Observable<SyncResponse> {
        const callSync = (syncToken?: string): Observable<SyncResponse> => {
            const filter = syncToken ? getIncrementalFilter(roomId) : getInitialFilter(roomId)

            const params = new URLSearchParams({
                timeout: syncTimeout.toString(),
                filter: JSON.stringify(filter),
                full_state: syncToken ? 'false' : 'true',
                set_presence: 'online',
                access_token: this.credentials.accessToken,
            })
            if (syncToken) {
                params.set('since', encodeURI(syncToken))
            }

            return ajax.getJSON(`${this.serverUrl}${PREFIX_REST}sync?` + params.toString())
        }

        // todo add retry
        return callSync().pipe(expand(r => callSync(r.next_batch)))
    }

    observableFromEvent(event: MatrixEvent) {
        return {
            id: event.event_id,
            observable: this.event(event.event_id, event),
        }
    }

    room(roomId: string): Observable<Room> {
        return this.sync(roomId).pipe(
            tap(console.log),
            map(it => it.rooms?.join ?? {}),
            map(extractCoreRoomsInfo),
            map(it => it[roomId]),
            map(it => {
                if (!it?.events) return it

                const eventObservables = getRootEvents(it.events).map(this.observableFromEvent.bind(this))
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
                 * other option is to re-emit events that were not consumed by anyone, but that probably would go bad places
                 *
                 */

                return {
                    ...it,
                    events: eventObservables,
                }
            }),
            scan((acc, curr = {events: []}) => {
                return {
                    ...acc,
                    ...curr,
                    events: [...acc.events, ...curr.events],
                }
            }),

            catchError(error => {
                console.log('error: ', error)
                return of(error)
            }),
        )
    }

    roomList(): Observable<Room[]> {
        return this.sync().pipe(
            map(it => it.rooms?.join ?? {}),
            map(extractCoreRoomsInfo),
            scan((acc, curr) => {
                return {...acc, ...curr}
            }),

            catchError(error => {
                console.log('error: ', error)
                return of(error)
            }),
        )
    }

    event(eventId: string, init: MatrixEvent): Observable<MatrixEvent> {
        const mergeEditEvent = (event: MatrixEvent, edit: MatrixEvent) => {
            if (event.type !== 'm.room.message' && edit.content['m.relates_to']?.rel_type !== 'm.replace') return event

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
                children: [...(root.children ?? []), this.observableFromEvent(threaded)],
                threadRoot: true,
            }
        }

        const eventOfInterest = (it: MatrixEvent) => {
            const unprocessedRelationship = it.content['m.relates_to']?.event_id === eventId && !it.processedAsChild
            return it.event_id === eventId || unprocessedRelationship
        }

        const rawEvent$ = bus.query(eventOfInterest).pipe(
            tap(it => console.log(it.event_id === eventId ? 'match on id' : 'match on rel')),
            scan((acc, curr) => {
                if (acc.event_id === curr.event_id) {
                    // todo why?
                    console.log('getting duplicate events 🤔')
                    return acc
                }
                const edited = mergeEditEvent(acc, curr)
                return mergeThreadEvent(edited, curr)
            }),
        )

        /**
         * todo
         * because we are creating a subscription here - the observable will stay "hot"
         * till we unsubscribe from
         * so likely here  I have a resource leak
         *
         * potential interesting avenue - use `takeWhile` or `takeUntil` to unsubscribe
         * relying on the status of the room observable
         */
        const subject = new BehaviorSubject(init)
        rawEvent$.subscribe(subject)
        return subject
    }
}

export const createClient = async () => {
    const apiClient = new ApiClient()
    const creds = await apiClient.login(import.meta.env.VITE_TEST_USER, import.meta.env.VITE_TEST_PASS, 'matrix.org')
    return new Matrix(creds)
}
