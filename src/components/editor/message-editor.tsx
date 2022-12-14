import {useMatrixClient} from '../context'
import {useCallback, useState} from 'react'
import {Editor} from './index'
import {CLEAR_EDITOR_COMMAND, EditorState, LexicalEditor} from 'lexical'

import {$generateHtmlFromNodes} from '@lexical/html'
import {$convertToMarkdownString, TRANSFORMERS} from '@lexical/markdown'
import {MentionsPlugin} from './plugins/mentions'
import {AugmentedRoomData} from '../../matrix/room'
import {debounce} from '../../core/utils'
import {KeyboardShortcutPlugin} from './plugins/keyboard-shortcuts'
import {Flex, Spinner} from '@chakra-ui/react'

const textMessage = (text: string) => ({
    msgtype: 'm.text',
    body: text,
})

const htmlMessage = (html: string, markdown: string) => ({
    msgtype: 'm.text',
    body: markdown,
    format: 'org.matrix.custom.html',
    formatted_body: html,
})

export interface MessageEditorProps {
    room: AugmentedRoomData
}

export function MessageEditor({room}: MessageEditorProps) {
    const client = useMatrixClient()
    const [html, setHtml] = useState('')
    const [markdown, setMarkdown] = useState('')
    const [editor, setEditor] = useState<LexicalEditor | null>(null)
    const [sending, setSending] = useState(false)

    const sendMessage = async () => {
        setSending(true)
        await client.sendMessage(room.id, htmlMessage(html, markdown))
        setSending(false)

        editor?.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
    }

    const onChange = useCallback(debounce((editorState: EditorState, editor: LexicalEditor) => {
            editorState.read(() => {
                setHtml($generateHtmlFromNodes(editor))
                setMarkdown($convertToMarkdownString(TRANSFORMERS))
            })
        }, 100)
        , [])

    return (
        <Flex
            className="message-editor"
            border={'1px solid'}
            borderColor={'gray.200'}
            padding={'0.5em'}
            borderRadius={'0.5em'}
        >
            <Editor
                emitEditor={setEditor}
                onChange={onChange}
                additionalPlugins={[
                    /**
                     * Consider deriving metadata for the message from the mentions, etc and attaching it to the message
                     * (like mentioned roam page ids, etc)
                     */
                    <MentionsPlugin key="page-mentions" suggestions={room.autocompleteSuggestions}/>,
                    <KeyboardShortcutPlugin key="kb-shortcut" onSendMessage={sendMessage}/>,
                ]}
            />
            {sending ? <Spinner margin="auto"/> : <button onClick={sendMessage}>Send</button>}
        </Flex>
    )
}
