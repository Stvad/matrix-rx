import {useMatrixClient} from '../context'
import {useCallback, useState} from 'react'
import {Editor} from './index'
import {CLEAR_EDITOR_COMMAND} from 'lexical'

import {$generateHtmlFromNodes} from '@lexical/html'
import {
    $convertToMarkdownString,
    TRANSFORMERS,
} from '@lexical/markdown'
import {EditorState, LexicalEditor} from 'lexical'
import {MentionsPlugin} from './plugins/mentions'
import {AugmentedRoomData} from '../../matrix/room'
import {debounce} from '../../core/utils'
import {KeyboardShortcutPlugin} from './plugins/keyboard-shortcuts'

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

    const sendMessage = () => {
        void client.sendMessage(room.id, htmlMessage(html, markdown))
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
        <div
            className="message-editor"
            css={{
                display: 'flex',
            }}
        >
            <Editor
                emitEditor={setEditor}
                onChange={onChange}
                additionalPlugins={[
                    /**
                     * Consider deriving metadata for the message from the mentions, etc and attaching it to the message
                     * (like mentioned roam page ids, etc)
                     */
                    <MentionsPlugin key='page-mentions' suggestions={room.autocompleteSuggestions}/>,
                    <KeyboardShortcutPlugin key='kb-shortcut' onSendMessage={sendMessage}/>,
                ]}
            />
            <button onClick={sendMessage}>Send
            </button>
        </div>
    )
}
