import {useObservableValue, useWhileMounted} from '../core/observable'
import {useEffect, useState} from 'react'
import {useMatrixClient} from './context'
import {Observable} from 'rxjs'
import {MatrixEvent} from '../matrix/types/Api'
import {MessageEditor} from './message-editor'
import {AugmentedRoomData} from '../matrix/room'
import {RoomSubject} from '../matrix/room-subject'

export function RoomList() {
    const [rooms, setRooms] = useState<AugmentedRoomData[]>([])
    const client = useMatrixClient()
    useWhileMounted(() => client.roomList().subscribe(it => setRooms(it)), [client])

    // todo use localstorage to save last room
    const [roomId, setRoomId] = useState<string>()

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

    return <div>
        <div className="roomName">{room?.name}</div>
        <button onClick={() => {
            room$?.loadOlderEvents(room?.backPaginationToken)
        }}>^
        </button>
        <div
            className={'messages'}
            css={{
                marginBottom: '1em',
            }}
        >
            {room?.messages?.map(it => <Event key={it.id} observable={it.observable}/>)}
        </div>
        <MessageEditor room={room}/>
    </div>
}

interface EventProps {
    observable: Observable<MatrixEvent>
}

export function Event({observable}: EventProps) {
    const event = useObservableValue(observable)

    return (
        <div>
            <div
                className="messageBody"
                css={{
                    display: 'flex',
                }}
            >
                <div
                    className="messageSender"
                    css={{
                        fontWeight: 'bold',
                    }}
                >{event?.sender}</div>
                :
                <div
                    className="messageContent"
                    css={{
                        marginLeft: '0.5em',
                    }}
                >{event?.content.body}</div>
            </div>
            <div
                className={'messageChildren'}
                css={{
                    marginLeft: '1em',
                }}
            >
                {event?.children?.map(it => <Event key={it.id} observable={it.observable}/>)}
            </div>
        </div>
    )
}
