import {EventsFilter, MessageEventType, RoomFilter, SyncFilter} from './types/Api'

export const MESSAGE_COUNT_INC = 100

const customEventsToSync: MessageEventType[] = [
    'matrix-rx.autocomplete'
]

const spaceEvents: MessageEventType[] = [
    'm.space.child',
    'm.space.parent',
]

// This generally should include all state events, as `state` and `timeline` are delivered
// in non-overlapping fashion - `state` include everything before start of timeline
const stateEventsToSync: MessageEventType[] = [
    'm.room.member',
    'm.room.name',
    'm.room.avatar',
    'm.room.canonical_alias',
    'm.room.join_rules',
    'm.room.power_levels',
    'm.room.topic',
    'm.room.create',
    'm.room.third_party_invite',
    ...customEventsToSync,
    ...spaceEvents
]

const timelineEventsToSync: MessageEventType[] = [
    'm.room.redaction',
    'm.room.message',
    'm.room.encrypted',
    ...stateEventsToSync
]

export function getIncrementalFilter(roomId?: string) {

    const accountFilterRoom: EventsFilter = {
        limit: 0,
        types: [],
    }

    const roomFilter: RoomFilter = {
        rooms: roomId ? [roomId] : undefined,
        timeline: {
            limit: MESSAGE_COUNT_INC,
            lazy_load_members: true,
            types: timelineEventsToSync,
        },
        state: {
            lazy_load_members: true,
            types: stateEventsToSync,
        },
        ephemeral: {
            lazy_load_members: true,
            types: ['m.receipt'],
        },
        include_leave: true,
        account_data: accountFilterRoom,
    }

    const accountFilter: EventsFilter = {
        types: ['m.direct'],
    }

    const filter: SyncFilter = {
        room: roomFilter,
        account_data: accountFilter,
        presence: {types: ['m.presence']},
    }
    return filter
}

export function getInitialFilter(roomId?: string) {
    const accountFilterRoom_: EventsFilter = {
        limit: 0,
        types: [],
    }

    const roomFilter_: RoomFilter = {
        rooms: roomId ? [roomId] : undefined,
        timeline: {
            limit: roomId ? 15 : 0,
            types: roomId ? timelineEventsToSync : [],
        },
        state: {
            lazy_load_members: true,
            types: stateEventsToSync,
        },
        ephemeral: {
            limit: 0,
            types: [],
        },
        include_leave: false,
        account_data: accountFilterRoom_,
    }

    const accountFilter_: EventsFilter = {
        types: ['m.direct', 'm.push_rules'],
    }

    const filter_: SyncFilter = {
        room: roomFilter_,
        account_data: accountFilter_,
        presence: {types: ['m.presence']},
    }
    return filter_
}
