import {ReactNode, useEffect, useMemo, useState} from 'react'
import {MatrixContext, useMatrixClient} from '../context'
import {useLocalStorageState} from '../../core/react'
import {Credentials} from '../../matrix/types/Credentials'
import {Matrix} from '../../matrix'
import {Room} from '../room'
import {Box} from '@chakra-ui/react'

const GuestMatrixContext = (props: { children: ReactNode, server: string }) => {
    const [credentials, setCredentials] = useLocalStorageState<Credentials>('matrix.guest.credentials')

    const [client, setClient] = useState<Matrix>()

    useEffect(() => {
        (async () => {
            if (!credentials) {
                const {credentials, client} = await Matrix.registerAsGuest(props.server)
                setCredentials(credentials)
                setClient(client)
            }
        })()
    }, [props.server])

    const contextContent = useMemo(() => ({
        client: client!, // ok, because we never return the context if client is null
        logout() {
            client?.logout()
            setCredentials(null)
            setClient(undefined)
        },
    }), [client])

    if (credentials && !client) {
        setClient(Matrix.fromCredentials(credentials))
    }

    if (!client) {
        return <Box>Loading...</Box>
    }

    return <MatrixContext.Provider value={contextContent} {...props}/>
}

export interface GuestRoomViewProps {
    roomId: string
    server: string
}

export const JoinRoom = ({roomId}: { roomId: string }) => {
    // TODO on first join, if you are a guest, matrix.org will ask you to agree to terms of service,
    //  and will return an error.

    const client = useMatrixClient()
    useEffect(() => {
        client.joinRoom(roomId).catch(console.error)
    }, [client])

    return null
}
export const GuestRoomView = ({roomId, server}: GuestRoomViewProps) => {

    // another aspect here is to load all the things? or not really, just allow for scrolling as usual 🤔
    return <GuestMatrixContext server={server}>
        <JoinRoom roomId={roomId}/>

        <Room roomId={roomId} showEditor={false} showTitle={false}/>
    </GuestMatrixContext>
}
