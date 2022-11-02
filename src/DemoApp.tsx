import {MainChatWindow} from './components'
import {Login} from './components/login'

function DemoApp() {
    return (
        <div className="App">
            <Login>
                <MainChatWindow/>
            </Login>
        </div>
    )
}

export default DemoApp
