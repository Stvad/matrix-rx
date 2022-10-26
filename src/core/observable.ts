import {DependencyList, useEffect, useState} from 'react'
import {BehaviorSubject, Subscription} from 'rxjs'

export const useObservableValue = <T>(subject: BehaviorSubject<T>) => {
    const [value, setValue] = useState(subject.getValue())
    useEffect(() => {
        const sub = subject.subscribe(s => setValue(s))
        return () => sub.unsubscribe()
    }, [subject])
    return value
}

export function useWhileMounted(subsFactory: () => Subscription, deps: DependencyList = []) {
    useEffect(() => {
        const sub = subsFactory()
        return () => sub?.unsubscribe()
    }, deps)
}
