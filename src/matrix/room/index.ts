import {MatrixEvent, RoomData, RoomNameEvent} from '../types/Api'
import {AutocompleteConfigurationEvent, AutocompleteSuggestion} from '../extensions/autocomplete'
import {ObservedEvent} from '../event'

export interface AugmentedRoomData extends RoomData {
    id: string
    events: MatrixEvent[]
    name: string
    backPaginationToken: string
    autocompleteSuggestions: AutocompleteSuggestion[]
    messages: ObservedEvent[]
    children: AugmentedRoomData[]
}

function getRoomName(events: MatrixEvent[]) {
    // todo need special handling for dm's
    // https://github.com/matrix-org/matrix-js-sdk/issues/637

    // @ts-ignore https://github.com/microsoft/TypeScript/issues/48829
    const nameEvent = events.findLast(e => e.type === 'm.room.name') as RoomNameEvent | undefined
    return nameEvent?.content.name
}

function getAutocompleteSuggestions(events: MatrixEvent[]) {
    // @ts-ignore https://github.com/microsoft/TypeScript/issues/48829
    const configEvent = events.findLast(
        (e: MatrixEvent) => e.type === 'matrix-rx.autocomplete',
    ) as AutocompleteConfigurationEvent | undefined
    return configEvent?.content.pages ?? []
}

const getChildRelationEvents = (loadedRoomEvents: MatrixEvent[]) =>
    loadedRoomEvents.filter(it => it.type === 'm.space.child')

export function createAugmentedRoom(id: string, room: RoomData): Partial<AugmentedRoomData> {
    // todo members
    const loadedRoomEvents = [...room.state.events, ...room.timeline.events]
    return {
        ...room,
        id,
        events: loadedRoomEvents,
        name: getRoomName(loadedRoomEvents),
        /** todo
         * the story is more complicated, can have windows of unloaded messages, etc
         */
        backPaginationToken: room.timeline.prev_batch,
        /**
         * todo: have the "extensions" be a list of functions that can be applied to the room
         */
        autocompleteSuggestions: getAutocompleteSuggestions(loadedRoomEvents),
    }
}

export const extractRoomsInfo = (rooms: { [id: string]: RoomData }): { [id: string]: Partial<AugmentedRoomData> } =>
    Object.fromEntries(Object.keys(rooms)
        .map(it => [it, createAugmentedRoom(it, rooms[it])]))

export const buildRoomHierarchy = (rooms: { [id: string]: AugmentedRoomData }): AugmentedRoomData[] => {
    const hasParent = new Set<string>()

    return Object.keys(rooms).map(it => {
        const room = rooms[it]
        const childrenEvents = getChildRelationEvents(room.events)
        // todo extract and handle order
        const children = childrenEvents.map(it => rooms[it.state_key!]).filter(Boolean)

        children.forEach(it => hasParent.add(it.id))

        return {
            ...room,
            children,
        }
    }).filter(it => !hasParent.has(it.id))
}

export function mergeNestedRooms(acc: { [id: string]: AugmentedRoomData }, curr: { [id: string]: Partial<AugmentedRoomData> }) {
    const mergedKeys = new Set([...Object.keys(curr), ...Object.keys(acc)])
    return Object.fromEntries([...mergedKeys].map(it =>
        [it, mergeRoom(acc[it] || {}, curr[it] || {})]))
}

export const mergeRoom = (aggregate: AugmentedRoomData, newData: Partial<AugmentedRoomData>) => {
    // todo performance wise - should be able to just do merge part of merge sort instead of full sort
    // todo dedup, though maybe even at an earlier stage (observable creation)
    const events = [...aggregate.events, ...(newData?.events ?? [])].sort((a, b) => a.timestamp - b.timestamp)

    const nonEmptyFields = Object.keys(newData).filter(it => !isEmpty(newData[it]))
    const newFields = Object.fromEntries(nonEmptyFields.map(it => [it, newData[it]]))

    /**
     * todo
     * This still has more issues.
     * The nested event lists are not merged & overridden with empty arrays
     * I don't really care for state & timeline as they are lifted into `events`
     * Account_data is tbd
     */

    return {
        ...aggregate,
        ...newFields,
        events,
    }
}

const isEmpty = (obj: any) => !obj ||
    obj instanceof Array && obj.length === 0 ||
    Object.keys(obj).length === 0
