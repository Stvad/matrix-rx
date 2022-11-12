import {catchError, filter, map, merge, mergeMap, Observable, of, ReplaySubject, scan, tap} from 'rxjs'
import {AugmentedRoomData, createAugmentedRoom, InternalRoomData, mergeRoom} from './index'
import {Omnibus} from 'omnibus-rxjs'
import {Matrix} from '../index'
import {Subscription} from 'rxjs/internal/Subscription'
import {EventSubject, getEventsWithRelationships, getRootEvents} from '../event'
import {MatrixEvent} from '../types/Api'

export interface ControlEvent {
    type: 'loadEventFromPast'

    [key: string]: any
}

type AugmentedRoomWithNoMessages = Omit<AugmentedRoomData, 'messages'>

/**
 * Can potentially be BehaviorSubject if I do any kind of local caching
 */
export class RoomSubject extends ReplaySubject<AugmentedRoomData> {
    /**
     * kind of unhappy with having to have this, is there a better way?
     * rn it's used to dedup event observables creation for the room
     */
    private observableRegistry = new Map<string, EventSubject>()

    private subscription: Subscription | undefined

    constructor(
        public roomId: string,
        private matrix: Matrix,
        /**
         * should event bus be room specific?
         * should event bus and control bus be the same thing?
         */
        private eventBus: Omnibus<MatrixEvent>,
        private controlBus: Omnibus<ControlEvent> = new Omnibus(),
    ) {
        super(1)
    }

    override subscribe(...args: any[]): Subscription {
        /**
         * Subscribe to underlying observable only someone is subscribing to this subject
         *
         * does this need to be more complicated (see `share` operator)?
         *
         */
        if (!this.subscription) {
            this.subscription = this.createObservable().subscribe(this)
        }

        return super.subscribe(...args)
    }


    // todo did pagination start taking longer?
    public loadOlderEvents(from: string, to?: string) {
        // todo meaningful only with active subscription, enforce?

        this.controlBus.trigger({type: 'loadEventFromPast', roomId: this.roomId, from, to})
    }

    createObservable(): Observable<AugmentedRoomData> {
        const roomFromSync = this.matrix.sync(this.roomId).pipe(
            tap(console.log),
            map(it => it.rooms?.join ?? {}),
            filter(it => it[this.roomId]),
            map(it => createAugmentedRoom(this.roomId, it[this.roomId])),
        )
        /**
         * todo: I need to do the event merging before deriving the room state
         * otherwise state updates like room rename, etc won't be taken into account
         * or do derivation of arriving partial and then merge the results
         * (e.g. new name event comes in and I can derive new name, overriding the old one on merge)
         */

        return merge(roomFromSync, this.onLoadEventsRequest()).pipe(
            // todo this type conversion is a lie for rooms from onLoadEventsRequest
            // may want to make it more like a fake room
            map(it => this.transformAndEmitEvents(it) as AugmentedRoomWithNoMessages),
            scan((acc: AugmentedRoomWithNoMessages, curr) => {
                // Don't do new data synthesis in scan, bc then new data is only available on the second+ batch of events
                // Merge should happen after initial event transformation
                return mergeRoom(acc, curr)
            }),
            map((it: AugmentedRoomWithNoMessages) => ({
                ...it,
                messages: it.events!.filter(it => it.value.type === 'm.room.message'),
            })),

            catchError(error => {
                console.log('roomsubject error: ', error)
                return of(error)
            }),
        )
    }

    private transformAndEmitEvents<T extends InternalRoomData>(room: T) {
        if (!room?._rawEvents) throw new Error('no events in room data')

        const rootEventsObservables = getRootEvents(room._rawEvents).map(it => this.createEventSubject(it))
        this.addToRegistry(rootEventsObservables)

        const eventsWithRelationshipsObservable =
            getEventsWithRelationships(room._rawEvents).map(it => this.createEventSubject(it))
        this.addToRegistry(eventsWithRelationshipsObservable)

        this.emitEvents(room)

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
            ...room,
            events: rootEventsObservables,
        }
    }

    private createEventSubject(it: MatrixEvent) {
        return new EventSubject(it, this.eventBus, this.observableRegistry)
    }

    private emitEvents(it: InternalRoomData) {
        it._rawEvents?.forEach(it => this.eventBus.trigger(it))
    }

    private addToRegistry(eventSubjects: EventSubject[]) {
        eventSubjects.forEach(it => {
            if (this.observableRegistry.has(it.value.event_id)) { // tracing those duplicates
                console.debug('already have event in registry', it.value.event_id)
            }
            this.observableRegistry.set(it.value.event_id, it)
        })
    }


    onLoadEventsRequest() {
        return this.controlBus.query((it => it.type === 'loadEventFromPast' && it.roomId === this.roomId))
            .pipe(
                tap(it => console.log('scrolling', it)),
                mergeMap((it) => this.matrix.loadHistoricEvents({roomId: this.roomId, from: it.from, to: it.to})),
            )
    }
}
