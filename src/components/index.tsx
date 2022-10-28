import {useObservableValue, useWhileMounted} from '../core/observable'
import {useEffect, useState} from 'react'
import {useMatrixClient} from './context'
import {AugmentedRoomData} from '../matrix'
import {Observable} from 'rxjs'
import {MatrixEvent} from '../matrix/types/Api'

export function RoomList() {
    const [rooms, setRooms] = useState<AugmentedRoomData[]>([])
    const client = useMatrixClient()
    useWhileMounted(() => client.roomList().subscribe(it => setRooms(it)), [client])

    const [roomId, setRoomId] = useState('!AtyuVyqNFWfJMwlbwR:matrix.org')

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
            <Room roomId={roomId}/>
        </div>
    )
}

interface RoomProps {
    roomId: string
}

export function Room({roomId}: RoomProps) {
    const client = useMatrixClient()
    // AugmentedRoomData is not quite right
    const [room, setRoom] = useState<AugmentedRoomData>(null)

    useEffect(() => {
        const room$ = client.room(roomId)
        const sub = room$.subscribe((it) => {
            setRoom(it)
        })
        return () => sub.unsubscribe()
    }, [roomId])

    console.log({room})
    return <div>
        <div className="roomName">{room?.name}</div>
        <button onClick={() => {
            client.triggerScroll(roomId, room?.backPaginationToken)
        }}>^
        </button>
        <div className={'messages'}>
            {room?.messages?.map(it => <Event key={it.id} observable={it.observable}/>)}
        </div>
        <MessageEntry roomId={roomId}/>
    </div>
}

interface EventProps {
    observable: Observable<MatrixEvent>
}

export function Event({observable}: EventProps) {
    const event = useObservableValue(observable)

    return (
        <div>
            <div className="messageBody">
                <div className="messageSender">{event?.sender}</div>
                :
                <div className="messageContent">{event?.content.body}</div>
            </div>
            <div className={'messageChildren'}>
                {event?.children?.map(it => <Event key={it.id} observable={it.observable}/>)}
            </div>
        </div>
    )
}

const textMessage = (text: string) => ({
    msgtype: 'm.text',
    body: text,
})

interface MessageEntryProps {
    roomId: string
}

export function MessageEntry({roomId}: MessageEntryProps) {
    const client = useMatrixClient()
    const [text, setText] = useState('')

    const sendMessage = () => {
        client.sendMessage(roomId, textMessage(text))
        setText('')
    }
    return (
        <div className="messageEntry">
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && e.metaKey) sendMessage()
                }}
            />
            <button onClick={sendMessage}>Send
            </button>
        </div>
    )
}
