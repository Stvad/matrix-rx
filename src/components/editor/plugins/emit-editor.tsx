import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {useEffect} from 'react'

import type {LexicalEditor} from 'lexical'

interface BubbleUpEditorPluginProps {
    emitEditor: (editor: LexicalEditor) => void;
}

export const BubbleUpEditorPlugin = ({emitEditor,}: BubbleUpEditorPluginProps) => {
    const [editor] = useLexicalComposerContext()
    useEffect(() => {
        if (editor) emitEditor(editor)
    }, [editor, emitEditor])

    return null
}
