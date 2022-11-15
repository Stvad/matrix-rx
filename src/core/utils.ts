export const debounce = (fn: Function, delayMs: number) => {
    let timer: number
    return (...args: any[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            fn(...args)
        }, delayMs)
    }
}
