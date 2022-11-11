import {useObservableValue} from '../core/observable'
import {MatrixEvent} from '../matrix/types/Api'
import {EventSubject} from '../matrix/event'

export interface EventProps {
    observable: EventSubject
}

export function MessageContent({event}: { event: MatrixEvent }) {
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

/**
 * Eventually want to move from "irc" layout to "slack" layout
 * but that requires "display aggregation" to work well, don't want to deal with that yet
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
                        alignItems: 'center',
                    }}
                >
                    <div
                        className="message-sender"
                        css={{
                            fontWeight: 'bold',
                        }}
                    >{event?.sender}</div>
                    :
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
