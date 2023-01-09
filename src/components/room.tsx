import {useMatrixClient} from './context'
import {useEffect, useState} from 'react'
import {AugmentedRoomData, RoomSubject} from '../matrix/room'
import {MessageEditor} from './editor/message-editor'
import {Flex, Heading, Spacer, Spinner} from '@chakra-ui/react'
import {MessageList} from './message-list'

interface RoomProps {
    roomId: string
    showEditor?: boolean
    showTitle?: boolean
}

export function Room({roomId, showEditor = true, showTitle = true}: RoomProps) {
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

    if (!room) {
        return <Spinner size={'xl'} margin={'auto'}/>
    }

    const loadMoreMessages = () => {
        const token = room?.gaps?.back?.token
        token && room$?.loadOlderEvents(token)
    }

    return <Flex
        className={'room'}
        direction={'column'}
        width={'100%'}
        padding={'1rem'}
    >
        {showTitle && <Heading
            size={'lg'}
            className="roomName"
            textAlign={'center'}
        >
            {room?.name}
        </Heading>}

        <MessageList messages={room?.messages} load={loadMoreMessages}/>

        <Spacer/>

        {showEditor && <MessageEditor room={room}/>}
    </Flex>
}

