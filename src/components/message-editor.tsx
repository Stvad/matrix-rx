import {useMatrixClient} from './context'
import {useState} from 'react'
import {Editor} from './editor'
import {CLEAR_EDITOR_COMMAND} from 'lexical'

import {$generateHtmlFromNodes} from '@lexical/html'
import {
    $convertToMarkdownString,
    TRANSFORMERS,
} from '@lexical/markdown'
import {EditorState, LexicalEditor} from 'lexical'
import {MentionsPlugin} from './editor/plugins/mentions'
import {AugmentedRoomData} from '../matrix/room'

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
        client.sendMessage(room.id, htmlMessage(html, markdown))
        editor?.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
    }
    return (
        <div
            className="messageEntry"
            css={{
                display: 'flex',
            }}
        >
            <Editor
                emitEditor={setEditor}
                // todo debounce
                onChange={(editorState: EditorState, editor: LexicalEditor) => {
                    editorState.read(() => {
                        setHtml($generateHtmlFromNodes(editor))
                        setMarkdown($convertToMarkdownString(TRANSFORMERS))
                    })
                }}
                additionalPlugins={[
                    <MentionsPlugin suggestions={room.autocompleteSuggestions}/>
                ]}
            />
            <button onClick={sendMessage}>Send
            </button>
        </div>
    )
}
