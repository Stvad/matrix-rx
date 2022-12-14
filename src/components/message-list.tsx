import {Box} from '@chakra-ui/react'
import {Event} from './event'
import {EventSubject} from '../matrix/event'
import ScrollToBottom, {useAtTop} from 'react-scroll-to-bottom'
import {ClassNames} from '@emotion/react'

interface MessageListProps {
    messages: EventSubject[]
    load: () => void
}

export function MessageList({messages, load}: MessageListProps) {
    function Messages() {
        const [atTop] = useAtTop()

        // todo:ux this is kind of chaotic rn, figure out a better loading UX
        if (atTop) load()

        return <>{
            messages?.map(it => <Event key={it.value.event_id} observable={it}/>)
        }</>
    }

    return <ClassNames>
        {({css}) => (
            <Box
                className={'messages'}
                marginBottom="1em"
                overflow={'auto'}
            >
                <ScrollToBottom className={css`height: 100%`}>
                    {<Messages/>}
                </ScrollToBottom>
            </Box>
        )}
    </ClassNames>
}
