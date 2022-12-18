import {useWhileMounted} from '../core/observable'
import {useState} from 'react'
import {useMatrixClient} from './context'
import {RoomHierarchyData} from '../matrix/room'
import {useLocalStorageState} from '../core/react'
import {RoomList} from './room-list'
import {Room} from './room'
import {Sidebar} from './sidebar'
import {Box} from '@chakra-ui/react'

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
                height: '100%',
            }}
        >
            <Sidebar>
                <RoomList rooms={rooms} setRoomId={setRoomId}/>
            </Sidebar>
            {roomId ?
                <Room roomId={roomId}/> :
                <Box margin="auto">No room selected</Box>
            }
        </div>
    )
}
