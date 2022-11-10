import {MatrixEvent, MessageEventType, ReplaceEvent} from './types/Api'
import {Observable, scan, tap} from 'rxjs'
import {Omnibus} from 'omnibus-rxjs'
import {DeferredSubscribeBehaviorSubject} from '../core/observable'

const hasRelationships = (event: MatrixEvent) => event.content['m.relates_to']
export const getEventsWithRelationships = (events: MatrixEvent[]) => events.filter(hasRelationships)
export const getRootEvents = (events: MatrixEvent[]) => events.filter(it => !hasRelationships(it))

export function isThreadChildOf(threaded: MatrixEvent, root: MatrixEvent) {
    const threadTypes = ['m.thread']

    return threadTypes.includes(threaded.content['m.relates_to']?.rel_type!) &&
        threaded.content['m.relates_to']?.event_id === root.event_id
}

export interface ObservedEvent {
    id: string,
    timestamp: number,
    type: MessageEventType,
    observable: Observable<MatrixEvent>,
}

export class EventSubject extends DeferredSubscribeBehaviorSubject<MatrixEvent> {
    constructor(
        private initEvent: MatrixEvent,
        private bus: Omnibus<MatrixEvent>,
        private observableRegistry: Map<string, Observable<MatrixEvent>>,
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
         *
         */

        super(initEvent, () => this.createObservable().subscribe(this))
    }

    static observedEvent(event: MatrixEvent, getObservable: () => Observable<MatrixEvent>): ObservedEvent {
        // todo with this becoming a subject this is redundant
        return {
            id: event.event_id,
            timestamp: event.origin_server_ts,
            type: event.type,
            observable: getObservable(),
        }
    }

    createObservable(): Observable<MatrixEvent> {
        const eventId = this.initEvent.event_id
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
                    EventSubject.observedEvent(threaded,
                        () => this.observableRegistry.get(threaded.event_id) || new EventSubject(threaded, this.bus, this.observableRegistry)),
                ],
                threadRoot: true,
            }
        }

        const eventOfInterest = (it: MatrixEvent) => {
            const unprocessedRelationship = it.content['m.relates_to']?.event_id === eventId && !it.processedAsChild
            return it.event_id === eventId || unprocessedRelationship
        }

        return this.bus.query(eventOfInterest).pipe(
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
    }
}
