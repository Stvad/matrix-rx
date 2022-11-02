import {useWhileMounted} from '../core/observable'
import {useEffect, useState} from 'react'
import {useMatrixClient} from './context'
import {MessageEditor} from './editor/message-editor'
import {AugmentedRoomData} from '../matrix/room'
import {RoomSubject} from '../matrix/room/subject'
import {useLocalStorageState} from '../core/react'
import {Event} from './event'

export function RoomList() {
    const [rooms, setRooms] = useState<AugmentedRoomData[]>([])
    const client = useMatrixClient()
    useWhileMounted(() => client.roomList().subscribe(it => setRooms(it)), [client])

    const [roomId, setRoomId] = useLocalStorageState<string>('matrix.lastRoomId', undefined)

    return (
        <div>
            <div>
                {Object.values(rooms).map(r =>
                    <button
                        key={r.id}
                        onClick={() => setRoomId(r.id)}
                    >
                        {r?.name}
                    </button>,
                )}
            </div>
            {roomId ? <Room roomId={roomId}/> : <div>No room selected</div>}
        </div>
    )
}

interface RoomProps {
    roomId: string
}

export function Room({roomId}: RoomProps) {
    const client = useMatrixClient()
    // AugmentedRoomData is not quite right
    const [room, setRoom] = useState<AugmentedRoomData | null>(null)
    const [room$, setRoom$] = useState<RoomSubject | null>(null)

    useEffect(() => {
        const room$ = client.room(roomId)
        setRoom$(room$)
        const sub = room$.subscribe((it) => {
            setRoom(it)
        })
        return () => sub.unsubscribe()
    }, [roomId])

    console.log({room})
    if (!room) {
        return <div>Loading...</div>
    }

    return <div>
        <div
            className="roomName"
            css={{
                fontSize: '1.5em',
                fontWeight: 'bold',
                textAlign: 'center',
            }}
        >
            {room?.name}
        </div>

        <button onClick={() => {
            room$?.loadOlderEvents(room?.backPaginationToken)
        }}>^
        </button>
        <div
            className={'messages'}
            css={{
                marginBottom: '1em',
            }}
        >
            {room?.messages?.map(it => <Event key={it.id} observable={it.observable}/>)}
        </div>
        <MessageEditor room={room}/>
    </div>
}

