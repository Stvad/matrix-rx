import {Dispatch, InputHTMLAttributes, SetStateAction, useState} from 'react'
import {Credentials} from '../matrix/types/Credentials'
import {login, Matrix} from '../matrix'
import {useLocalStorageState} from '../core/react'
import {MatrixContext} from './context'

// todo typing
function useInput(props: InputHTMLAttributes<HTMLInputElement>): [JSX.Element, string, Dispatch<SetStateAction<string>>] {
    const [value, setValue] = useState(props.defaultValue)
    return [<input {...props} value={value} onChange={it=> setValue(it.target.value)} />, value, setValue]
}

export function Login(props) {
    const [credentials, setCredentials] = useLocalStorageState<Credentials>('credentials')
    const [client, setClient] = useState<Matrix>()

    const [userNameInput, userName] = useInput({placeholder: 'Username'})
    const [passwordInput, password] = useInput({placeholder: 'Password', type: 'password'})
    const [serverInput, server] = useInput({placeholder: 'Server', defaultValue: 'matrix.org'})

    if (credentials && !client) {
        console.log({credentials})
        setClient(Matrix.fromCredentials(credentials))
    }

    if (client) {
        return <MatrixContext.Provider value={{client}} {...props}/>
    }

    return <div>
        <h1>Login</h1>
        {userNameInput}
        {passwordInput}
        {serverInput}
        <button
            onClick={async () => {
               setCredentials(await login({userId: userName, password: password, server: server}))
            }}
        >Login</button>
    </div>
}
