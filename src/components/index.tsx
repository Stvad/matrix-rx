import {useWhileMounted} from '../core/observable'
import {useState} from 'react'
import {useMatrixClient} from './context'
import {RoomHierarchyData} from '../matrix/room'
import {useLocalStorageState} from '../core/react'
import {RoomList} from './room-list'
import {Room} from './room'

export function MainChatWindow() {
    const [rooms, setRooms] = useState<RoomHierarchyData[]>([])
    const client = useMatrixClient()
    useWhileMounted(() => client.roomList().subscribe(it => setRooms(it)), [client])

    const [roomId, setRoomId] = useLocalStorageState<string>('matrix.lastRoomId', undefined)

    return (
        <div
            css={{
                display: 'flex',
                width: '100%',
            }}
        >
            <RoomList rooms={rooms} setRoomId={setRoomId}/>
            {roomId ? <Room roomId={roomId}/> : <div>No room selected</div>}
        </div>
    )
}
