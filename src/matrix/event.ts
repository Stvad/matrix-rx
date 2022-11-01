import {MatrixEvent} from './types/Api'

const hasRelationships = (event: MatrixEvent) => event.content['m.relates_to']
export const getEventsWithRelationships = (events: MatrixEvent[]) => events.filter(hasRelationships)
export const getRootEvents = (events: MatrixEvent[]) => events.filter(it => !hasRelationships(it))

export function isThreadChildOf(threaded: MatrixEvent, root: MatrixEvent) {
    const threadTypes = ['m.thread']

    return threadTypes.includes(threaded.content['m.relates_to']?.rel_type!) &&
        threaded.content['m.relates_to']?.event_id === root.event_id
}
