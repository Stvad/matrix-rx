import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import {createClient} from './matrix'
import {bind, Subscribe} from '@react-rxjs/core'

const client = await createClient()
const [useRooms, rooms$] = bind(client.roomList())
const [useRoom, room$] = bind(client.room("!AtyuVyqNFWfJMwlbwR:matrix.org"))

function App() {
  return (
    <div className="App">
        <Subscribe>
            <RoomList/>
        </Subscribe>
    </div>
  )
}

function RoomList() {
    const rooms = useRooms()
    const room = useRoom()

    return (
        <div>
            <div>{Object.values(rooms).map(r => <button>{r?.name}</button>)}</div>
            <div>
                {room?.events?.map(it => <div>{it?.content?.body}</div>)}

            </div>
        </div>
    )
}

export default App;
