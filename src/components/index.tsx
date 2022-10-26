import {useObservableValue, useWhileMounted} from '../core/observable'
import {useEffect, useState} from 'react'
import {useMatrixClient} from './context'

export function RoomList() {
    const [rooms, setRooms] = useState([])
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

function Room({roomId}) {
    const client = useMatrixClient()
    const [room, setRoom] = useState(null)

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

export function Event({observable}) {
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

function MessageEntry({roomId}) {
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
