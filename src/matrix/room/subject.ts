import {catchError, filter, map, merge, mergeMap, Observable, of, ReplaySubject, scan, tap} from 'rxjs'
import {AugmentedRoomData, createAugmentedRoom, mergeRoom} from './index'
import {Omnibus} from 'omnibus-rxjs'
import {Matrix} from '../index'
import {Subscription} from 'rxjs/internal/Subscription'
import {EventSubject, getEventsWithRelationships, getRootEvents} from '../event'
import {MatrixEvent} from '../types/Api'

export interface ControlEvent {
    type: 'loadEventFromPast'

    [key: string]: any
}

/**
 * Can potentially be BehaviorSubject if I do any kind of local caching
 */
export class RoomSubject extends ReplaySubject<AugmentedRoomData> {
    /**
     * kind of unhappy with having to have this, is there a better way?
     * rn it's used to dedup event observables creation for the room
     */
    private observableRegistry = new Map<string, Observable<MatrixEvent>>()

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

    createObservable() {
        const roomFromSync = this.matrix.sync(this.roomId).pipe(
            tap(console.log),
            map(it => it.rooms?.join ?? {}),
            filter(it => it[this.roomId]),
            map(it => createAugmentedRoom(this.roomId, it[this.roomId])),
        )
        /**
         * todo: I need to do the event merging before deriving the room state
         * otherwise state updates like room rename, etc won't be taken into account
         */

        return merge(roomFromSync, this.onLoadEventsRequest()).pipe(
            map(it => {
                if (!it?.events) return it

                const rootEventsObservables = getRootEvents(it.events).map(it => this.getObservedEvent(it))
                this.addToRegistry(rootEventsObservables)

                const eventsWithRelationshipsObservable =
                    getEventsWithRelationships(it.events).map(it => this.getObservedEvent(it))
                this.addToRegistry(eventsWithRelationshipsObservable)

                // todo internalize this into the class
                this.emitEvents(it)

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
                return mergeRoom(acc, curr)
            }),
            map(it => ({
                ...it,
                messages: it.events.filter(it => it.type === 'm.room.message'),
            })),

            catchError(error => {
                console.log('error: ', error)
                return of(error)
            }),
        )
    }

    private getObservedEvent(it: MatrixEvent) {
        return EventSubject.observedEvent(it, () => new EventSubject(it, this.eventBus, this.observableRegistry))
    }

    private emitEvents(it: { events: MatrixEvent[] }) {
        if (it?.events) it.events?.forEach(it => this.eventBus.trigger(it))
    }

    private addToRegistry(eventObservables: { observable: Observable<MatrixEvent>; id: string }[]) {
        eventObservables.forEach(it => this.observableRegistry.set(it.id, it.observable))
    }


    onLoadEventsRequest() {
        return this.controlBus.query((it => it.type === 'loadEventFromPast' && it.roomId === this.roomId))
            .pipe(
                tap(it => console.log('scrolling', it)),
                mergeMap((it) => this.matrix.loadHistoricEvents({roomId: this.roomId, from: it.from, to: it.to})),
            )
    }
}
