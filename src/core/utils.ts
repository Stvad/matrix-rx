export const debounce = (fn: Function, delayMs: number) => {
    let timer: ReturnType<typeof setTimeout>
    return (...args: any[]) => {
        clearTimeout(timer)
        timer = setTimeout(() => {
            fn(...args)
        }, delayMs)
    }
}
