import {RoomList} from './components'
import {Login} from './components/login'

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
