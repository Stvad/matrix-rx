import {LexicalComposer} from '@lexical/react/LexicalComposer'
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin'
import {ContentEditable} from '@lexical/react/LexicalContentEditable'
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin'
import {AutoFocusPlugin} from '@lexical/react/LexicalAutoFocusPlugin'
import {ClearEditorPlugin} from '@lexical/react/LexicalClearEditorPlugin'
import ToolbarPlugin from './plugins/toolbar'
import {HeadingNode, QuoteNode} from '@lexical/rich-text'
import {TableCellNode, TableNode, TableRowNode} from '@lexical/table'
import {ListItemNode, ListNode} from '@lexical/list'
import {CodeHighlightNode, CodeNode} from '@lexical/code'
import {AutoLinkNode, LinkNode} from '@lexical/link'
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin'
import {ListPlugin} from '@lexical/react/LexicalListPlugin'
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin'
import {TRANSFORMERS} from '@lexical/markdown'

import CodeHighlightPlugin from './plugins/code'
import AutoLinkPlugin from './plugins/auto-link'
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin'
import {EditorState, LexicalEditor} from 'lexical'
import {BubbleUpEditorPlugin} from './plugins/emit-editor'
import {MentionNode} from './nodes/mention'

function Placeholder() {
    return <div className="editor-placeholder">Message...</div>
}

const editorConfig = {
    // theme: ExampleTheme,
    // Handling of errors during update
    onError (error: Error, editor: LexicalEditor) {
        throw error
    },
    namespace: 'lexical-editor',

    nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        CodeNode,
        CodeHighlightNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        MentionNode,
    ],
}

interface EditorProps {
    onChange: (editorState: EditorState, editor: LexicalEditor) => void;
    emitEditor: (editor: LexicalEditor) => void;
    // todo probably need to pass nodes too
    additionalPlugins?: JSX.Element[];
}

export function Editor({onChange, emitEditor, additionalPlugins}: EditorProps) {
    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div
                className="editor-container"
            >
                <ToolbarPlugin/>
                <div className="editor-inner">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input"/>}
                        placeholder={<Placeholder/>}
                    />
                    <HistoryPlugin/>
                    <AutoFocusPlugin/>
                    <CodeHighlightPlugin/>
                    <ListPlugin/>
                    <LinkPlugin/>
                    <AutoLinkPlugin/>
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS}/>
                    <OnChangePlugin onChange={onChange}/>
                    <ClearEditorPlugin/>
                    <BubbleUpEditorPlugin emitEditor={emitEditor}/>
                    {additionalPlugins}
                </div>
            </div>
        </LexicalComposer>
    )
}

