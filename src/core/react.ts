import {useState} from 'react'

export const useLocalStorageState = <T>(key: string, defaultValue?: T) => {
    const [state, setState] = useState(() => {
        const storedValue = window.localStorage.getItem(key)
        return storedValue ? JSON.parse(storedValue) : defaultValue
    })

    const wrappedSetState = (value: T) => {
        setState(value)
        window.localStorage.setItem(key, JSON.stringify(value))
    }
    return [state, wrappedSetState]
}
