import {DependencyList, useEffect, useState} from 'react'
import {BehaviorSubject, ReplaySubject, Subscription} from 'rxjs'

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

// todo maybe mixin
export class DeferredSubscribeBehaviorSubject<T> extends BehaviorSubject<T> {
    private subscription: Subscription | undefined

    constructor(initialValue: T, private factory: () => Subscription) {
        super(initialValue)
    }

    override subscribe(...args: any[]): Subscription {
        /**
         * Subscribe to underlying observable only someone is subscribing to this subject
         *
         * does this need to be more complicated (see `share` operator)?
         *
         */
        if (!this.subscription) {
            this.subscription = this.factory()
        }

        return super.subscribe(...args)
    }
}
