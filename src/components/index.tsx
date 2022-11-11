import {useWhileMounted} from '../core/observable'
import {useEffect, useState} from 'react'
import {useMatrixClient} from './context'
import {MessageEditor} from './editor/message-editor'
import {AugmentedRoomData} from '../matrix/room'
import {RoomSubject} from '../matrix/room/subject'
import {useLocalStorageState} from '../core/react'
import {Event} from './event'

function RoomList({rooms, setRoomId}: { rooms: AugmentedRoomData[], setRoomId: (roomId: string) => void }) {
    console.log('rlist', {rooms})
    return <div
        css={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '1em',
        }}
    >
        {rooms?.map(r =>
            <button
                key={r.id}
                onClick={(e) => {
                    e.stopPropagation()
                    setRoomId(r.id)
                }}
            >
                {r?.name}
                {r?.children?.length && <RoomList rooms={r.children} setRoomId={setRoomId}/>}
            </button>)}
    </div>
}

export function MainChatWindow() {
    const [rooms, setRooms] = useState<AugmentedRoomData[]>([])
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

    return <div
        className={'room'}
        css={{
            width: '100%',
        }}
    >
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
            room$?.loadOlderEvents(room?.gaps.back.token)
        }}>^
        </button>
        <div
            className={'messages'}
            css={{
                marginBottom: '1em',
            }}
        >
            {room?.messages?.map(it => <Event key={it.value.event_id} observable={it}/>)}
        </div>
        {room && <MessageEditor room={room}/>}
    </div>
}

