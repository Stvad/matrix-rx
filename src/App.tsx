import {useEffect, useState} from 'react'
import './App.css'
import {createClient} from './matrix'
import {useObservableValue} from './core/observable'
import {Subscription} from 'rxjs'

const client = await createClient({
    userId: import.meta.env.VITE_TEST_USER,
    password: import.meta.env.VITE_TEST_PASS,
    server: 'matrix.org',
})
const rooms$ = client.roomList()

function App() {
    return (
        <div className="App">
            <RoomList/>
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
        <div>
            {room?.messages?.map(it => <Event key={it.id} observable={it.observable}/>)}
        </div>
    </div>
}

function useWhileMounted(subsFactory: () => Subscription) {
    useEffect(() => {
        const sub = subsFactory()
        return () => sub?.unsubscribe()
    }, [])
}

function RoomList() {
    const [rooms, setRooms] = useState([])
    useWhileMounted(() => rooms$.subscribe(it => setRooms(it)))

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
