import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {KEY_ENTER_COMMAND} from 'lexical'
import {COMMAND_PRIORITY_NORMAL} from 'lexical'
import {useEffect} from 'react'

export function KeyboardShortcutPlugin({onSendMessage}) {
    const [editor] = useLexicalComposerContext()
    useEffect(() => {
        return editor.registerCommand(KEY_ENTER_COMMAND, (payload) => {
            const event: KeyboardEvent = payload
            if (event.metaKey) {
                event.stopPropagation()
                event.preventDefault()
                onSendMessage()
            }

        }, COMMAND_PRIORITY_NORMAL)
    }, [editor, onSendMessage])

    return null
}
