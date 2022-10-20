import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'
import {createClient} from './matrix'
import {bind, Subscribe} from '@react-rxjs/core'

const client = await createClient()
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

function RoomList() {
    const rooms = useRooms()

    return (
        <div>
            {Object.values(rooms).map(room =><button>{room.name}</button>)}
        </div>
    )
}

export default App;
