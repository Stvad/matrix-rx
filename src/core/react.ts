import {useState} from 'react'
import {useMediaQuery} from '@chakra-ui/react'

export const useLocalStorageState = <T>(key: string, defaultValue?: T) => {
    const [state, setState] = useState(() => {
        const storedValue = window.localStorage.getItem(key)
        if (storedValue === 'undefined') return defaultValue

        return storedValue ? JSON.parse(storedValue) : defaultValue
    })

    const wrappedSetState = (value: T) => {
        setState(value)
        window.localStorage.setItem(key, JSON.stringify(value))
    }
    return [state, wrappedSetState]
}


export const useOnMobile = () => useMediaQuery('(max-width: 800px)')[0]
