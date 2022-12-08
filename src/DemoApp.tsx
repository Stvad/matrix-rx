import {MainChatWindow} from './components'
import {Login} from './components/login'
import {ChakraProvider} from '@chakra-ui/react'


function DemoApp() {
    return (
        <div className="App">
            <ChakraProvider>
                <Login>
                    <MainChatWindow/>
                </Login>
            </ChakraProvider>
        </div>
    )
}

export default DemoApp
