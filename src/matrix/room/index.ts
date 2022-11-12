import {MatrixEvent, RoomData, RoomNameEvent} from '../types/Api'
import {AutocompleteConfigurationEvent, AutocompleteSuggestion} from '../extensions/autocomplete'
import {EventSubject} from '../event'

export interface TimelineGap {
    token: string,
    timestamp: number,
}

interface CommonRoomAugmentations {
    id: string
    name: string
    gaps: { back?: TimelineGap }
    autocompleteSuggestions: AutocompleteSuggestion[]
}

export interface InternalRoomData {
    _rawEvents: MatrixEvent[]
}

export interface InternalAugmentedRoom extends RoomData, CommonRoomAugmentations, InternalRoomData {
}


// output of full room pipeline
export interface AugmentedRoomData extends RoomData, CommonRoomAugmentations {
    events: EventSubject[]
    messages: EventSubject[]
}

// used in RoomList
export interface RoomHierarchyData extends RoomData, CommonRoomAugmentations {
    children: RoomHierarchyData[]
}

function getRoomName(events: MatrixEvent[]) {
    // todo need special handling for dm's
    // https://github.com/matrix-org/matrix-js-sdk/issues/637

    // @ts-ignore https://github.com/microsoft/TypeScript/issues/48829
    const nameEvent = events.findLast(e => e.type === 'm.room.name') as RoomNameEvent | undefined
    return nameEvent?.content.name ?? 'DM guess: ' + events[0].sender
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

export function createAugmentedRoom(id: string, room: RoomData): InternalAugmentedRoom {
    // todo extract members
    const loadedRoomEvents = [...room.state.events, ...room.timeline.events]
    return {
        ...room,
        id,
        _rawEvents: loadedRoomEvents,
        name: getRoomName(loadedRoomEvents),
        /** todo
         * the story is more complicated, can have windows of unloaded messages, etc
         *
         */
        gaps: {
            back: room.timeline.prev_batch && room.timeline.events[0]?.origin_server_ts && {
                token: room.timeline.prev_batch,
                timestamp: room.timeline.events[0]?.origin_server_ts,
            } || undefined,
        },
        /**
         * todo: have the "extensions" be a list of functions that can be applied to the room
         */
        autocompleteSuggestions: getAutocompleteSuggestions(loadedRoomEvents),
    }
}

export const extractRoomsInfo = (rooms: { [id: string]: RoomData }): { [id: string]: InternalAugmentedRoom } =>
    Object.fromEntries(Object.keys(rooms)
        .map(it => [it, createAugmentedRoom(it, rooms[it])]))

export function mergeNestedRooms(acc: { [id: string]: InternalAugmentedRoom }, curr: { [id: string]: InternalAugmentedRoom }) {
    const mergedKeys = new Set([...Object.keys(curr), ...Object.keys(acc)])

    const mergeNestedRoom = (id: string) =>
        mergeRoom(acc[id], curr[id] || {}, {_rawEvents: fieldMergers._rawEvents})

    return Object.fromEntries([...mergedKeys].map(it =>
        [it, acc[it] ? mergeNestedRoom(it) : curr[it]]))
}

export const buildRoomHierarchy = (rooms: { [id: string]: InternalAugmentedRoom }): RoomHierarchyData[] => {
    const hasParent = new Set<string>()
    const idToChildren = new Map<string, string[]>()

    Object.entries(rooms).forEach(([id, room]) => {
        const childrenEvents = getChildRelationEvents(room._rawEvents)
        // todo extract and handle room order
        const childrenIds = childrenEvents.filter(it => rooms[it.state_key!]).map(it => it.state_key!)
        childrenIds.forEach(it => hasParent.add(it))

        idToChildren.set(id, childrenIds)
    })

    function constructHierarchyMap() {
        // Type conversion is a hack here, figure out a better way.
        // Need to explicitly modify the "children" vs creating a new object bc
        // rooms need to maintain references to each other

        const roomHierarchies = new Map<string, RoomHierarchyData>(Object.entries(rooms) as unknown as [string, RoomHierarchyData][])
        roomHierarchies.forEach((room, id) => {
            room.children = idToChildren.get(id)?.map(it => roomHierarchies.get(it)!) ?? []
        })
        return roomHierarchies
    }

    const roomHierarchies = constructHierarchyMap()
    return [...roomHierarchies.values()].filter(it => !hasParent.has(it.id))
}

const fieldMergers = {
    // todo performance wise - should be able to just do merge part of merge sort instead of full sort
    // todo dedup, though maybe even at an earlier stage (observable creation)

    events: (x: { events: EventSubject[] }, y: { events: EventSubject[] }) =>
        [...x.events, ...(y?.events ?? [])].sort((a, b) => a.value.origin_server_ts - b.value.origin_server_ts),
    _rawEvents: (x: { _rawEvents: MatrixEvent[] }, y: { _rawEvents: MatrixEvent[] }) =>
        [...x._rawEvents, ...(y?._rawEvents ?? [])].sort((a, b) => a.origin_server_ts - b.origin_server_ts),
}

export const mergeRoom = <T extends CommonRoomAugmentations, N extends CommonRoomAugmentations>(
    aggregate: T,
    newData: N,
    fieldMerger: { [id: string]: any } = {events: fieldMergers.events},
): T => {
    const mergedFields = Object.fromEntries(
        Object.keys(fieldMerger)
            .map(it => [it,
                fieldMerger[it](aggregate, newData)]))

    const allKeys = Object.keys(newData) as (keyof N)[]
    const nonEmptyKeys = allKeys.filter(it => !isEmpty(newData[it]))
    const newFields = Object.fromEntries(nonEmptyKeys.map(it => [it, newData[it]]))

    /**
     * todo
     * this function is a mess type wise, probably better off separating the hierarchy and Augment room use-cases
     * though I hope to arrive at solution that brings them closer together
     *
     *
     * also
     * This still has more issues.
     * The nested event lists (state, timeline) are not merged & overridden with latest data (which is usually empty)
     * I don't really care for state & timeline as they are lifted into `events`
     * - but we should clearly indicate that that is not a part of the aggregate (e.g. by removing it from the type)
     *
     * Account_data is tbd
     */

    return {
        ...aggregate,
        ...newFields,
        ...mergedFields,
        gaps: {
            /**
             * We want to have the token associated with the oldest message (retrieved on first sync or on back pagination)
             */
            back: mergeGapBack(aggregate.gaps.back!, newData?.gaps?.back),
        },
    }
}

const mergeGapBack = (aggregate: TimelineGap, newData: TimelineGap | undefined) => {
    if (newData && newData.timestamp < aggregate.timestamp) {
        return newData
    }
    return aggregate
}

const isEmpty = (obj: any) => !obj ||
    obj instanceof Array && obj.length === 0 ||
    Object.keys(obj).length === 0
