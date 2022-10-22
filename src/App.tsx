import {useEffect, useState} from 'react'
import './App.css'
import {createClient} from './matrix'
import {bind, Subscribe} from '@react-rxjs/core'

const client = await createClient()
const [useRooms, rooms$] = bind(client.roomList())
const [useRoom, room$] = bind(client.room('!AtyuVyqNFWfJMwlbwR:matrix.org'))

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
        event$.subscribe((it) => {
            setEvent(it)
        })
    }, [])

    return (
        <div>
            <div>{event?.sender}</div>
            <div>{event?.content.body}</div>
            <div>{event?.children?.map(it => <Event observable={it}/>)}</div>
        </div>
    )
}

function RoomList() {
    const rooms = useRooms()
    const room = useRoom()

    return (
        <div>
            <div>{Object.values(rooms).map(r => <button key={r.id}>{r?.name}</button>)}</div>
            <div>
                {room?.events?.map(it => <Event observable={it}/>)}
            </div>
        </div>
    )
}

export default App
