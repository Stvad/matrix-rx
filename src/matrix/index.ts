import {catchError, expand, map, Observable, of, scan, tap} from 'rxjs'
import {ApiClient, PREFIX_REST} from './api/ApiClient'
import {ajax} from 'rxjs/internal/ajax/ajax'
import {EventsFilter_, MatrixEvent, RoomData, RoomFilter_, RoomNameEvent, SyncFilter_, SyncResponse} from './types/Api'

interface Room {
}

export const MESSAGE_COUNT_INC = 100
const syncTimeout = 10000

function getIncrementalFilter() {

    const accountFilterRoom: EventsFilter_ = {
        limit: 0,
        types: [],
    }

    const roomFilter: RoomFilter_ = {
        timeline: {
            limit: MESSAGE_COUNT_INC,
            lazy_load_members: true,
            types: [
                'm.room.third_party_invite',
                'm.room.redaction',
                'm.room.message',
                'm.room.member',
                'm.room.name',
                'm.room.avatar',
                'm.room.canonical_alias',
                'm.room.join_rules',
                'm.room.power_levels',
                'm.room.topic',
                'm.room.encrypted',
                'm.room.create',
            ],
        },
        state: {
            lazy_load_members: true,
            types: [
                'm.room.member',
                'm.room.name',
                'm.room.avatar',
                'm.room.canonical_alias',
                'm.room.join_rules',
                'm.room.power_levels',
                'm.room.topic',
                'm.room.create',
            ],
        },
        ephemeral: {
            lazy_load_members: true,
            types: ['m.receipt'],
        },
        include_leave: true,
        account_data: accountFilterRoom,
    }

    const accountFilter: EventsFilter_ = {
        types: ['m.direct'],
    }

    const filter: SyncFilter_ = {
        room: roomFilter,
        account_data: accountFilter,
        presence: {types: ['m.presence']},
    }
    return filter
}

function getInitialFilter() {
    const accountFilterRoom_: EventsFilter_ = {
        limit: 0,
        types: [],
    }

    const roomFilter_: RoomFilter_ = {
        timeline: {
            limit: 0,
            types: [],
        },
        state: {
            lazy_load_members: true,
            types: [
                'm.room.third_party_invite',
                'm.room.member',
                'm.room.name',
                'm.room.avatar',
                'm.room.canonical_alias',
                'm.room.join_rules',
                'm.room.power_levels',
                'm.room.topic',
                'm.room.create',
            ],
        },
        ephemeral: {
            limit: 0,
            types: [],
        },
        include_leave: false,
        account_data: accountFilterRoom_,
    }

    const accountFilter_: EventsFilter_ = {
        types: ['m.direct', 'm.push_rules'],
    }

    const filter_: SyncFilter_ = {
        room: roomFilter_,
        account_data: accountFilter_,
        presence: {types: ['m.presence']},
    }
    return filter_
}

function extractCoreRoomsInfo(rooms: { [id: string]: RoomData }) {
    function getRoomName(events: MatrixEvent[]) {
        const nameEvent = events.findLast(e => e.type === 'm.room.name') as RoomNameEvent | undefined
        return nameEvent?.content.name ?? ''
    }

    function extractRoomInfo(id: string) {
        const room = rooms[id]
        // todo members
        return {
            id,
            name: getRoomName([...room.state.events, ...room.timeline.events]),
        }
    }

    return Object.fromEntries(Object.keys(rooms).map(it => [it, extractRoomInfo(it)]))
}

export class Matrix {
    constructor(
        private credentials: any,
        private serverUrl: string = `https://matrix-client.matrix.org`) {
    }

    sync(): Observable<SyncResponse> {
        const callSync = (syncToken?: string): Observable<SyncResponse> => {
            const filter = syncToken ? getIncrementalFilter() : getInitialFilter()

            const params = new URLSearchParams({
                timeout: syncTimeout.toString(),
                filter: JSON.stringify(filter),
                full_state: syncToken ? 'false' : 'true',
                set_presence: 'online',
                access_token: this.credentials.accessToken,
            })
            if (syncToken) {
                params.set('since', encodeURI(syncToken))
            }

            return ajax.getJSON(`${this.serverUrl}${PREFIX_REST}sync?` + params.toString())
        }

        // todo add retry
        return callSync().pipe(expand(r => callSync(r.next_batch)))
    }

    roomList(): Observable<Room[]> {
        return this.sync().pipe(
            tap(console.log),
            map(it => it.rooms?.join ?? {}),
            map(extractCoreRoomsInfo),
            scan((acc, curr) => {
                return {...acc, ...curr}
            }),

            tap(console.log),

            catchError(error => {
                console.log('error: ', error)
                return of(error)
            }),
        )
    }
}

export const createClient = async () => {
    const apiClient = new ApiClient()
    // todo don't
    const creds = await apiClient.login('metavlad', '', 'matrix.org')
    return new Matrix(creds)
}
