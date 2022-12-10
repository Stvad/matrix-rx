import {useMatrixClient} from './context'
import {useEffect, useState} from 'react'
import {AugmentedRoomData, RoomSubject} from '../matrix/room'
import {Event} from './event'
import {MessageEditor} from './editor/message-editor'
import {Flex, Spacer, Spinner} from '@chakra-ui/react'

interface RoomProps {
    roomId: string
}

export function Room({roomId}: RoomProps) {
    const client = useMatrixClient()
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
        return <Spinner
            size={'xl'}
            margin={'auto'}
        />
    }

    return <Flex
        className={'room'}
        direction={'column'}
        width={'100%'}
        padding={'1rem'}
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
        <Spacer/>
        {room && <MessageEditor room={room}/>}
    </Flex>
}
