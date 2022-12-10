//sidebar props extending div props
import {
    Button,
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent, DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    IconButton,
    useDisclosure,
} from '@chakra-ui/react'
import {HamburgerIcon} from '@chakra-ui/icons'

import {BoxProps} from '@chakra-ui/layout'
import {useMatrixContext} from './context'

interface SidebarProps extends BoxProps {
}

export const Sidebar = (props: SidebarProps) => {
    const {isOpen, onOpen, onClose} = useDisclosure()
    const matrixCtx = useMatrixContext()

    return <>
        <IconButton
            icon={<HamburgerIcon w={5} h={5}/>}
            variant="outline"
            onClick={onOpen}
            position={'absolute'}
            top={'0.5rem'}
            left={'0.5rem'}
            aria-label={'Show rooms'}
        />

        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            placement="left"
        >
            <DrawerOverlay/>
            <DrawerContent>
                <DrawerCloseButton/>
                <DrawerHeader>Rooms</DrawerHeader>

                <DrawerBody>
                    {props.children}
                </DrawerBody>
                <DrawerFooter>
                    <Button colorScheme='pink' onClick={() => matrixCtx.logout()}>Logout</Button>
                </DrawerFooter>

            </DrawerContent>
        </Drawer>
    </>
}
