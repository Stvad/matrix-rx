import {MatrixEvent, MessageEventType, ReplaceEvent} from './types/Api'
import {BehaviorSubject, map, Observable, scan, Subscription, tap} from 'rxjs'
import {Omnibus} from 'omnibus-rxjs'

const hasRelationships = (event: MatrixEvent) => event.content['m.relates_to']
export const getEventsWithRelationships = (events: MatrixEvent[]) => events.filter(hasRelationships)
export const getRootEvents = (events: MatrixEvent[]) => events.filter(it => !hasRelationships(it))

export function isThreadChildOf(threaded: MatrixEvent, root: MatrixEvent) {
    const threadTypes = ['m.thread']

    return threadTypes.includes(threaded.content['m.relates_to']?.rel_type!) &&
        threaded.content['m.relates_to']?.event_id === root.event_id
}

/**
 * The issue with doing thins like this is that if in the future the Matrix API changes -
 * I potentially have to introduce breaking changes
 */
export interface AggregatedEvent extends MatrixEvent {
    kind: 'aggregated-event'
    children: EventSubject[]
    isEdited?: boolean
}

export interface RawEvent extends MatrixEvent {
    kind: 'raw-event'
}

const rawToAggregated = (it: RawEvent | AggregatedEvent | MatrixEvent) => ({
    ...it,
    kind: 'aggregated-event',
    children: []
} as AggregatedEvent)


/**
 * Todo describe how the event aggregation works with bus/etc
 */
export class EventSubject extends BehaviorSubject<AggregatedEvent> {
    private subscription: Subscription

    constructor(
        private initEvent: MatrixEvent,
        private bus: Omnibus<RawEvent | AggregatedEvent>,
        private observableRegistry: Map<string, EventSubject>,
    ) {
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
         */

        super(rawToAggregated(initEvent))
        this.subscription = this.createObservable().subscribe(this)
    }

    createObservable(): Observable<AggregatedEvent> {
        const eventId = this.initEvent.event_id
        const mergeReplaceEvent = (event: AggregatedEvent, edit: AggregatedEvent): AggregatedEvent => {
            const isReplaceEvent = (ev: MatrixEvent): ev is ReplaceEvent =>
                ev.content['m.relates_to']?.rel_type === 'm.replace'

            if (!isReplaceEvent(edit)) return event

            return {
                ...event,
                content: {
                    ...event.content,
                    ...edit.content['m.new_content'],
                },
                isEdited: true,
            }
        }

        const mergeThreadEvent = (root: AggregatedEvent, threaded: AggregatedEvent): AggregatedEvent => {
            if (!isThreadChildOf(threaded, root)) return root

            const child = this.observableRegistry.get(threaded.event_id)
            if (!child) throw new Error('EventSubject for event not found in registry: ' + threaded.event_id)

            return {
                ...root,
                // todo sort?
                children: [
                    ...root.children,
                    child,
                ],
            }
        }

        const eventOfInterest = (it: RawEvent | AggregatedEvent): it is RawEvent => {
            const isRelationship = it.content['m.relates_to']?.event_id === eventId
            return (it.event_id === eventId || isRelationship) && it.kind === 'raw-event'
        }

        return this.bus.query(eventOfInterest).pipe(
            tap(it => console.log(it.event_id === eventId ? 'match on id' : 'match on rel')),
            map(rawToAggregated),
            scan((acc: AggregatedEvent, curr: AggregatedEvent) => {
                if (acc.event_id === curr.event_id) {
                    // todo why?
                    // generally need to handle deduplication of events
                    // see https://spec.matrix.org/v1.4/client-server-api/#:~:text=clients%20should%20de-duplicate%20events%20
                    console.log('getting duplicate events 🤔')
                    return acc
                }
                const edited = mergeReplaceEvent(acc, curr)
                return mergeThreadEvent(edited, curr)
            }),
        )
    }
}
