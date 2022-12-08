import {useObservableValue} from '../core/observable'
import {AggregatedEvent, EventSubject} from '../matrix/event'
import {Box} from '@chakra-ui/react'

export interface EventProps {
    observable: EventSubject
}

export function MessageContent({event}: { event: AggregatedEvent }) {
    const sharedProps = {
        className: 'message-content',
    }
    if (event.content.format === 'org.matrix.custom.html') {
        return <div
            {...sharedProps}
            css={{
                marginLeft: '0.5em',
            }}
            dangerouslySetInnerHTML={{__html: event.content.formatted_body!}}
        />
    }

    return <div
        {...sharedProps}
        css={{
            marginLeft: '0.5em',
            whiteSpace: 'pre-wrap',
        }}
    >{event?.content.body}</div>
}

function MessageSender({event, fullUserName = false}: { event: AggregatedEvent, fullUserName?: boolean }) {
    const localName = event?.sender?.split(':')[0]
    const sender = fullUserName ? event?.sender : localName
    return <Box
        className="message-sender"
        fontWeight={'bold'}
        marginBottom={'0.5em'}
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
        <div>
            <div
                className="message-body"
                css={{
                    display: 'flex',
                }}
            >
                <div
                    css={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <MessageSender event={event}/>
                    <MessageContent event={event}/>
                </div>
            </div>
            <div
                className={'message-children'}
                css={{
                    marginLeft: '1em',
                }}
            >
                {event?.children?.map(it => <Event key={it.value.event_id} observable={it}/>)}
            </div>
        </div>
    )
}
