import {createContext, useContext} from 'react'
import {Matrix} from '../matrix'

export interface MatrixContextProps {
    client: Matrix
    logout: () => void
}

export const MatrixContext = createContext<MatrixContextProps | undefined>(undefined)

export const useMatrixContext = () => {
    const ctx = useContext(MatrixContext)
    if (!ctx) throw new Error('useClient must be used within a MatrixContext')
    return ctx
}

export const useMatrixClient = () => useMatrixContext().client
