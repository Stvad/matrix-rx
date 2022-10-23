import {useEffect, useState} from 'react'
import {BehaviorSubject} from 'rxjs'

export const useObservableValue = <T>(subject: BehaviorSubject<T>) => {
    const [value, setValue] = useState(subject.getValue())
    useEffect(() => {
        const sub = subject.subscribe(s => setValue(s))
        return () => sub.unsubscribe()
    }, [subject])
    return value
}
