import {useEffect, useState} from 'react'
import './App.css'
import {createClient} from './matrix'
import {bind, Subscribe} from '@react-rxjs/core'

const client = await createClient()
const [useRooms, rooms$] = bind(client.roomList())
// const [useRoom, room$] = bind(client.room('!AtyuVyqNFWfJMwlbwR:matrix.org'))

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
    const [event, setEvent] = useState(null)
    useEffect(() => {
        const [_, event$] = bind(observable, {sender: 'sender', content: {body: 'body'}})
        const sub = event$.subscribe((it) => {
            setEvent(it)
        })
        return () => sub.unsubscribe()
    }, [])

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

function RoomList() {
    const rooms = useRooms()
    const [room, setRoom] = useState(null)
    const [roomId, setRoomId] = useState('!AtyuVyqNFWfJMwlbwR:matrix.org')

    useEffect(() => {
        const [_, room$] = bind(client.room(roomId))
        const sub = room$.subscribe((it) => {
            setRoom(it)
        })
        // todo unsubscribe
        return () => sub.unsubscribe()
    }, [roomId])

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
            <div>
                {room?.events?.map(it => <Event key={it.id} observable={it.observable}/>)}
            </div>
        </div>
    )
}

export default App
