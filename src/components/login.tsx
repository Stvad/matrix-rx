import {Dispatch, ReactNode, SetStateAction, useMemo, useState} from 'react'
import {Credentials} from '../matrix/types/Credentials'
import {login, Matrix} from '../matrix'
import {useLocalStorageState} from '../core/react'
import {MatrixContext} from './context'
import {Button, Center, Flex, Heading, Input, Stack} from '@chakra-ui/react'
import {InputProps} from '@chakra-ui/input'

type InputValue = string | number | ReadonlyArray<string> | undefined

// todo:low improve on typing
function useInput<T extends InputValue>(props: InputProps): [JSX.Element, T | undefined, Dispatch<SetStateAction<InputValue>>] {
    const [value, setValue] = useState(props.defaultValue)
    return [<Input {...props} value={value}
                   onChange={it => setValue(it.target.value)}/>, value as T | undefined, setValue]
}

interface LoginProps {
    onLogin?: (credentials: Credentials) => void
    children?: ReactNode
}

export function Login(props: LoginProps) {
    // todo use a store provide by props
    const credentialsKey = 'matrix.credentials'
    const [credentials, setCredentials] = useLocalStorageState<Credentials>(credentialsKey)
    const [client, setClient] = useState<Matrix>()

    const [userNameInput, userName] = useInput<string>({placeholder: 'Username'})
    const [passwordInput, password] = useInput<string>({placeholder: 'Password', type: 'password'})
    const [serverInput, server] = useInput<string>({placeholder: 'Server', defaultValue: 'matrix.org'})

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

    if (client) return <MatrixContext.Provider value={contextContent} {...props}/>

    const onLogin = async () => {
        if (!userName || !password || !server) {
            alert('Required fields are missing')
            return
        }

        const newCreds = await login({userId: userName, password: password, server: server})
        setCredentials(newCreds)
        props.onLogin?.(newCreds)
    }

    // todo:ux submit on enter

    return <Center height={'100%'}>
        <Flex
            direction={'column'}
            margin="auto"
        >
            <Heading
                marginBottom="1rem"
                textAlign={'center'}
            >Login</Heading>

            <Stack>
                {userNameInput}
                {passwordInput}
                {serverInput}
            </Stack>

            <Button
                marginTop="1rem"
                colorScheme="blue"
                onClick={onLogin}
            >Login
            </Button>
        </Flex>
    </Center>
}
