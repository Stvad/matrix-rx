import './App.css'
import {Matrix} from './matrix'
import {RoomList} from './components'
import {Login} from './components/login'

const client = await Matrix.fromUserAndPassword({
    userId: import.meta.env.VITE_TEST_USER,
    password: import.meta.env.VITE_TEST_PASS,
    server: 'matrix.org',
})

function DemoApp() {
    return (
        <div className="App">
            <Login>
                <RoomList/>
            </Login>
        </div>
    )
}

export default DemoApp
