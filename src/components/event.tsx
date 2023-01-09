import {useObservableValue} from '../core/observable'
import {AggregatedEvent, EventSubject} from '../matrix/event'
import {Box, Flex} from '@chakra-ui/react'
import {localName} from '../matrix/utils'

export interface EventProps {
    observable: EventSubject
}

const isRedacted = (event: AggregatedEvent) => !event.content.body && event.redacted_because !== undefined
export function MessageContent({event}: { event: AggregatedEvent }) {
    const messageContentCss = {
        marginLeft: '0.5em',
    }

    const htmlCss = {
        blockquote: {
            borderLeft: '4px solid #ccc',
            padding: '0 1em',
            color: '#666',
        },
    }

    const sharedProps = {
        ...messageContentCss,
        className: 'message-content',
    }

    const RedactedMessageContent = () => <Box {...sharedProps} title='Message deleted'>🗑️</Box>

    if (isRedacted(event)) return <RedactedMessageContent/>

    if (event.content.format === 'org.matrix.custom.html') {
        return <Box
            {...sharedProps}
            css={htmlCss}
            dangerouslySetInnerHTML={{__html: event.content.formatted_body!}}
        />
    }

    return <Box
        {...sharedProps}
        whiteSpace='pre-wrap'
    >{event?.content.body}</Box>
}

function MessageSender({event, fullUserName = false}: { event: AggregatedEvent, fullUserName?: boolean }) {
    const sender = fullUserName ? event?.sender : localName(event.sender)
    return <Box
        className="message-sender"
        fontWeight={'bold'}
        marginBottom={'0.1em'}
        marginTop={'0.3em'}
    >
        {sender}
    </Box>
}

/**
 * Eventually want to move from "irc" layout to "slack" layout
 * but that requires "display aggregation" to work well, don't want to deal with that yet
 *
 * partition by sender & time? (and maybe look up the rules that Element is currently using)
 */
export function Event({observable}: EventProps) {
    const event = useObservableValue(observable)

    return (
        <Box>
            <Flex className="message-body">
                <Flex direction={'column'}>
                    <MessageSender event={event}/>
                    <MessageContent event={event}/>
                </Flex>
            </Flex>
            <Box
                className={'message-children'}
                css={{
                    marginLeft: '1em',
                }}
            >
                {event?.children?.map(it => <Event key={it.value.event_id} observable={it}/>)}
            </Box>
        </Box>
    )
}
