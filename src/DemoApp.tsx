import {MainChatWindow} from './components'
import {Login} from './components/login'
import {ChakraProvider} from '@chakra-ui/react'


function DemoApp() {
    return (
        <ChakraProvider>
            <Login>
                <MainChatWindow/>
            </Login>
        </ChakraProvider>
    )
}

export default DemoApp
