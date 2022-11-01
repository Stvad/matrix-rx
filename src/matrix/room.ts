import {MatrixEvent, RoomData, RoomNameEvent} from './types/Api'
import {AutocompleteConfigurationEvent} from './extensions/autocomplete'

export interface AugmentedRoomData extends RoomData {
    id: string
    events: MatrixEvent[]
    name: string
    backPaginationToken: string
    autocompleteSuggestions: string[]
}

function getRoomName(events: MatrixEvent[]) {
    // @ts-ignore https://github.com/microsoft/TypeScript/issues/48829
    const nameEvent = events.findLast(e => e.type === 'm.room.name') as RoomNameEvent | undefined
    return nameEvent?.content.name ?? ''
}

function getAutocompleteSuggestions(events: MatrixEvent[]) {
    // @ts-ignore https://github.com/microsoft/TypeScript/issues/48829
    const configEvent = events.findLast(
        (e: MatrixEvent) => e.type === 'matrix-rx.autocomplete',
    ) as AutocompleteConfigurationEvent | undefined
    return configEvent?.content.pageNames ?? []
}

export function createAugmentedRoom(id: string, room: RoomData) {
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
        autocompleteSuggestions: getAutocompleteSuggestions(loadedRoomEvents),
        ...room,
    }
}

export const extractCoreRoomsInfo = (rooms: { [id: string]: RoomData }): { [id: string]: AugmentedRoomData } =>
    Object.fromEntries(Object.keys(rooms)
        .map(it => [it, createAugmentedRoom(it, rooms[it])]))
