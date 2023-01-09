import {ReactNode, useEffect, useMemo, useState} from 'react'
import {MatrixContext, useMatrixClient} from '../context'
import {useLocalStorageState} from '../../core/react'
import {Credentials} from '../../matrix/types/Credentials'
import {Matrix} from '../../matrix'
import {Room} from '../room'
import {Box, Spinner} from '@chakra-ui/react'

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
        return <Spinner size={'xl'} margin={'auto'}/>
    }

    return <MatrixContext.Provider value={contextContent} {...props}/>
}

export interface GuestRoomViewProps {
    roomId: string
    server: string
}

export const JoinRoom = ({roomId}: { roomId: string }) => {
    const client = useMatrixClient()

    /**
     * This is potentially idiosyncratic to matrix.org server. Need to test it elsewhere!
     */
    async function handleConsentError(error: {body: {errcode: string, error: string, consent_uri: string}}) {
        console.log('Consent error. Trying to automatically handle it.', error)
        if (error.body.errcode !== 'M_CONSENT_NOT_GIVEN') throw error

        const consentUri = new URL(error.body.consent_uri)
        consentUri.searchParams.set('v', '1.0')

        await fetch(consentUri, {method: 'POST', mode: 'no-cors'})

        await client.joinRoom(roomId)
    }

    useEffect(() => {
        client.joinRoom(roomId).catch(handleConsentError)
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
