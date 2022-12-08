//sidebar props extending div props
import {
    Drawer,
    DrawerBody,
    DrawerCloseButton,
    DrawerContent,
    DrawerHeader,
    DrawerOverlay,
    IconButton,
    useDisclosure,
} from '@chakra-ui/react'
import {HamburgerIcon} from '@chakra-ui/icons'

import {BoxProps} from '@chakra-ui/layout'

interface SidebarProps extends BoxProps {
}

export const Sidebar = (props: SidebarProps) => {
    const {isOpen, onOpen, onClose} = useDisclosure()

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

            </DrawerContent>
        </Drawer>
    </>
}
