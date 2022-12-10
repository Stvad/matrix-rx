import {UIEvent, useRef} from 'react'
import {Box} from '@chakra-ui/react'
import {Event} from './event'
import {EventSubject} from '../matrix/event'
import ScrollToBottom from 'react-scroll-to-bottom'
import {ClassNames, css} from '@emotion/react'

interface MessageListProps {
    messages: EventSubject[]
    load: () => void
}

export function MessageList({messages, load}: MessageListProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)

    function loadMoreMessages(e: UIEvent<HTMLDivElement>) {
        if (e.currentTarget?.scrollTop !== 0) return

        load()
    }

    if (!hasOverflow(containerRef.current)) load()

    return <Box
        ref={containerRef}
        className={'messages'}
        marginBottom="1em"
        overflow={'auto'}
        onScroll={(e) => loadMoreMessages(e)}
    >
        <ClassNames>
            {({css}) => (
                <ScrollToBottom className={css`height: 100%`}>
                    {messages?.map(it => <Event key={it.value.event_id} observable={it}/>)}
                </ScrollToBottom>
            )}
        </ClassNames>
    </Box>
}

const hasOverflow = (current: HTMLDivElement | null) =>
    current && (current.scrollHeight > current.clientHeight)
