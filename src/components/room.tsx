import {useMatrixClient} from './context'
import {useEffect, useState} from 'react'
import {AugmentedRoomData, RoomSubject} from '../matrix/room'
import {Event} from './event'
import {MessageEditor} from './editor/message-editor'

interface RoomProps {
    roomId: string
}

export function Room({roomId}: RoomProps) {
    const client = useMatrixClient()
    // AugmentedRoomData is not quite right
    const [room, setRoom] = useState<AugmentedRoomData | null>(null)
    const [room$, setRoom$] = useState<RoomSubject | null>(null)

    useEffect(() => {
        setRoom(null)
        const room$ = client.room(roomId)
        setRoom$(room$)
        const sub = room$.subscribe((it: AugmentedRoomData) => {
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
            const token = room?.gaps?.back?.token
            token && room$?.loadOlderEvents(token)
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
