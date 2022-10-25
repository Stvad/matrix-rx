import {useEffect, useState} from 'react'
import './App.css'
import {createClient} from './matrix'
import {bind, Subscribe} from '@react-rxjs/core'
import {useObservableValue} from './core/observable'

const client = await createClient({
    userId: import.meta.env.VITE_TEST_USER,
    password: import.meta.env.VITE_TEST_PASS,
    server: 'matrix.org',
})
const [useRooms, rooms$] = bind(client.roomList())

function App() {
    return (
        <div className="App">
            <Subscribe>
                <RoomList/>
            </Subscribe>
        </div>
    )
}

function Event({observable}) {
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

function Room({roomId}) {
    const [room, setRoom] = useState(null)

    useEffect(() => {
        const [_, room$] = bind(client.room(roomId))
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
        }}>^</button>
        <div>
            {room?.messages?.map(it => <Event key={it.id} observable={it.observable}/>)}
        </div>
    </div>
}

function RoomList() {
    const rooms = useRooms()
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

export default App
