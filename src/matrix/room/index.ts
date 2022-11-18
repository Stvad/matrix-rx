import {
    catchError,
    filter,
    map,
    merge,
    mergeAll,
    mergeMap,
    Observable,
    of,
    ReplaySubject,
    scan,
    share,
    switchMap,
    tap,
} from 'rxjs'
import {createAugmentedRoom, mergeRoom} from './utils'
import {Omnibus} from 'omnibus-rxjs'
import {LoadEventsParams, Matrix} from '../index'
import {Subscription} from 'rxjs/internal/Subscription'
import {AggregatedEvent, EventSubject, RawEvent} from '../event'
import {MatrixEvent, RoomData, RoomMessagesResponse} from '../types/Api'
import {AutocompleteSuggestion} from '../extensions/autocomplete'

export interface ControlEvent {
    type: 'loadEventFromPast' | 'load-events'

    [key: string]: any
}

export interface LoadEventsControlEvent extends ControlEvent, LoadEventsParams {
    type: 'load-events',
}

export interface TimelineGap {
    token: string,
    timestamp: number,
}

export interface CommonRoomAugmentations {
    id: string
    name: string
    gaps: { back?: TimelineGap }
    // todo move to "extensions" that are dynamically assembled
    autocompleteSuggestions: AutocompleteSuggestion[]
}

export interface InternalRoomData {
    _rawEvents: MatrixEvent[]
}

export interface InternalAugmentedRoom extends RoomData, CommonRoomAugmentations, InternalRoomData {
}

export interface HasEvents {
    events: EventSubject[]
}

// output of full room pipeline
export interface AugmentedRoomData extends RoomData, CommonRoomAugmentations, HasEvents {
    messages: EventSubject[]
}

// used in RoomList
export interface RoomHierarchyData extends RoomData, CommonRoomAugmentations {
    children: RoomHierarchyData[]
}

type AugmentedRoomWithNoMessages = Omit<AugmentedRoomData, 'messages'>

interface RoomSubjectParams {
    id: string
    matrix: Matrix
    sinceEventId?: string
    eventBus?: Omnibus<RawEvent | AggregatedEvent>
    controlBus?: Omnibus<ControlEvent>
}

type IntermediateObservableRoom =
    AugmentedRoomWithNoMessages
    | Pick<InternalAugmentedRoom, '_rawEvents' | 'gaps'> & HasEvents

/**
 * Can potentially be BehaviorSubject if I do any kind of local caching
 */
export class RoomSubject extends ReplaySubject<AugmentedRoomData> {
    /**
     * kind of unhappy with having to have this, is there a better way?
     * rn it's used to dedup event observables creation for the room
     */
    private readonly observableRegistry = new Map<string, EventSubject>()
    private readonly _observable: Observable<IntermediateObservableRoom>

    private subscription: Subscription | undefined

    public readonly id: string

    private readonly matrix: Matrix

    /** should event bus and control bus be the same thing? */
    private readonly eventBus: Omnibus<RawEvent | AggregatedEvent> = new Omnibus()
    // can probably be replaced with a subject
    private readonly controlBus: Omnibus<ControlEvent> = new Omnibus()

    constructor(
        {
            id,
            matrix,
            sinceEventId,
            eventBus = new Omnibus(),
            controlBus = new Omnibus(),
        }: RoomSubjectParams,
    ) {
        super(1)
        this.id = id
        this.matrix = matrix
        this.eventBus = eventBus
        this.controlBus = controlBus

        this._observable = this.createObservable(sinceEventId)
    }

    private createObservable(sinceEventId?: string) {
        const eventsSince = sinceEventId ? [this.matrix.loadEventsSince(this.id, sinceEventId).pipe(map(asRoomPartial))] : []

        return this.roomObservableFromSources(
            this.roomFromSync(),
            [
                this.onLoadPastEventsRequest(),
                ...eventsSince,
            ])
            .pipe(share())
    }

    override subscribe(...args: any[]): Subscription {
        /**
         * It's important to create this subscription first before subscribing to underlying observable
         * Otherwise the first return value is potentially lost (not delivered to actual subscriber)
         */
        const subjectSubscription = super.subscribe(...args)

        /**
         * Subscribe to underlying observable only someone is subscribing to this subject
         *
         * does this need to be more complicated (see `share` operator)?
         *
         */
        if (!this.subscription) {
            this.subscription = this.roomStateObservable().subscribe(this)
        }

        return subjectSubscription
    }


    /**
     * todo: if user calls this a few times in a quick succession, it'll load the same events multiple times
     * I should probably configure the observable to ignore duplicate requests. presumably the params will remain the same
     *
     * I also keep wondering if I should do dedup inside pipeline, but that seems like a wrong solution
     */
    // todo did pagination start taking longer?
    public loadOlderEvents(from: string, to?: string) {
        // todo meaningful only with active subscription, enforce?
        // or would be even better if I could enforce that structurally (e.g.) you can only call this on a
        // subscription returned from subject

        this.controlBus.trigger({type: 'loadEventFromPast', roomId: this.id, from, to})
    }

    public watchEvents(): Observable<EventSubject> {
        /**
         * I'm not happy how this is a separate observable even though it's relying and dependent on the room data
         * or like it's the same observable but subscription management is confusing
         */
        /**
         * todo this also rn only emits top level events, but not relations (e.g. reactions)
         * bc of how underlying observer partitions them
         */
        return this._observable.pipe(map(it => it.events), mergeAll())
    }

    public watchEventValues(): Observable<AggregatedEvent> {
        return this.watchEvents().pipe(mergeAll())
    }

    private roomStateObservable(): Observable<AugmentedRoomData> {
        /**
         * todo: I need to do the event merging before deriving the room state
         * otherwise state updates like room rename, etc won't be taken into account
         * or do derivation from arriving partial and then merge the results
         * (e.g. new name event comes in and I can derive new name, overriding the old one on merge)
         */

        const pickTopLevelEvents = (it: IntermediateObservableRoom) => ({...it, events: getRootEvents(it.events)})

        return this._observable.pipe(
            map(pickTopLevelEvents),
            // @ts-ignore todo, I'm confused why this does not type resolve
            // Conversion is valid as we ensure that scan event is always first
            scan((acc: IntermediateObservableRoom, curr: IntermediateObservableRoom): AugmentedRoomWithNoMessages => {
                // Don't do new data synthesis in scan, bc then new data is only available on the second+ batch of events
                // Merge should happen after initial event transformation
                return mergeRoom(acc as AugmentedRoomWithNoMessages, curr) as AugmentedRoomWithNoMessages
            }),
            map((it: AugmentedRoomWithNoMessages) => ({
                ...it,
                messages: it.events.filter(it => it.value.type === 'm.room.message'),
            })),

            catchError(error => {
                console.log('roomsubject error: ', error)
                return of(error)
            }),
        )
    }

    private roomObservableFromSources(
        sync: Observable<InternalAugmentedRoom>,
        eventSources: Observable<Pick<InternalAugmentedRoom, '_rawEvents' | 'gaps'>>[],
    ): Observable<IntermediateObservableRoom> {
        // delay eventSources subscriptions until sync has emitted at least once
        const sharedSync = sync.pipe(share())
        const delayedEventSources = eventSources.map(it => sharedSync.pipe(switchMap(() => it)))

        return merge(sharedSync, ...delayedEventSources).pipe(
            /**
             * todo I have a suspicion that enforcing deduplication here may be a bad idea (it'd hide problems)
             */
            map(it => this.removeDuplicateEvents(it)),
            map(it => this.createAndRegisterEventSubjects(it)),
            tap(it => this.emitEvents(it._rawEvents)),
        )
    }

    private removeDuplicateEvents<T extends InternalRoomData>(room: T) {
        return {
            ...room,
            _rawEvents: room._rawEvents.filter(it => !this.observableRegistry.has(it.event_id)),
        }
    }

    private roomFromSync() {
        return this.matrix.sync(this.id).pipe(
            map(it => it.rooms?.join ?? {}),
            filter(it => !!it[this.id]),
            map(it => createAugmentedRoom(this.id, it[this.id])),
        )
    }

    private createAndRegisterEventSubjects<T extends InternalRoomData>(room: T) {
        if (!room?._rawEvents) throw new Error('no events in room data')

        const events = room._rawEvents.map(it => this.createEventSubject(it))
        this.addToRegistry(events)

        return {
            events: events,
            ...room,
        }

        /**
         * todo: this is probably outdated
         *
         * right now second+ order relations are dropped
         * (e.g. edit a message in a thread)
         * bc. there is no listener for it either on top or "relates to" level
         *
         * should I create those observables for all events, and then retrieve them by id when needed?
         * - this is probably ok, maybe avoiding some obviously "leaf" events
         * - for server supported relations - it seems that the server will include some relations in the root event
         *   - not clear if it's part of the spec/will there be all events/etc
         *   - also probably prevents from supporting custom relations?
         *   - see https://spec.matrix.org/v1.3/client-server-api/#aggregations
         *     - it seems for threads it'd include just the latest event, which is not very useful
         *     - for reactions it'd include all reactions, which can be used to assemble the event faster
         * other option is to re-emit events that were not consumed by anyone, but that probably would go bad places
         *
         */
    }

    private createEventSubject(it: MatrixEvent) {
        return new EventSubject(it, this.eventBus, this.observableRegistry)
    }

    private emitEvents(events: MatrixEvent[]) {
        events?.forEach(it => this.eventBus.trigger({...it, kind: 'raw-event'}))
    }

    private addToRegistry(eventSubjects: EventSubject[]) {
        eventSubjects.forEach(it => {
            if (this.observableRegistry.has(it.value.event_id)) { // tracing those duplicates
                // todo
                console.debug('already have event in registry', it.value.event_id)
                return
            }
            this.observableRegistry.set(it.value.event_id, it)
        })
    }

    private onLoadEventsRequest(): Observable<Pick<InternalAugmentedRoom, '_rawEvents' | 'gaps'>> {

        const loadEventBatch = (ev: LoadEventsControlEvent) => this.matrix.loadEventBatch(ev).pipe(map(asRoomPartial))

        return this.controlBus
            .query((it => it.type === 'load-events'))
            .pipe(mergeMap(it => loadEventBatch(it as LoadEventsControlEvent)))

    }

    private onLoadPastEventsRequest(): Observable<Pick<InternalAugmentedRoom, '_rawEvents' | 'gaps'>> {
        const loadEventBatch = (it: ControlEvent) =>
            this.matrix.loadEventBatch({
                roomId: this.id,
                from: it.from,
                to: it.to,
                direction: 'b',
            }).pipe(map(asRoomPartial))

        return this.controlBus
            .query((it => it.type === 'loadEventFromPast' && it.roomId === this.id))
            .pipe(mergeMap(loadEventBatch))
    }
}

const asRoomPartial = (it: RoomMessagesResponse) => ({
    _rawEvents: it.chunk,
    gaps: {
        back: it.end ? {
            token: it.end,
            timestamp: it.chunk[0].origin_server_ts,
        } : undefined,
    },
})

const getRootEvents = (events: EventSubject[]) => events.filter(it => !hasRelationships(it))
const hasRelationships = (event: EventSubject) => event.value.content['m.relates_to']
