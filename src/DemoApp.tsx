import './App.css'
import {createClient} from './matrix'
import {RoomList} from './components'
import {MatrixContext} from './components/context'

const client = await createClient({
    userId: import.meta.env.VITE_TEST_USER,
    password: import.meta.env.VITE_TEST_PASS,
    server: 'matrix.org',
})

function DemoApp() {
    return (
        <div className="App">
            <MatrixContext.Provider value={{client}}>
                <RoomList />
            </MatrixContext.Provider>
        </div>
    )
}

export default DemoApp
