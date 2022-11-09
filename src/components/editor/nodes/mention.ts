/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// from
// https://raw.githubusercontent.com/facebook/lexical/89a4593cc0fd213f1a5655f464461a4d2d43c294/packages/lexical-playground/src/nodes/MentionNode.ts

import type {Spread} from 'lexical'

import {
    DOMConversionMap,
    DOMConversionOutput,
    DOMExportOutput,
    EditorConfig,
    LexicalNode,
    NodeKey,
    SerializedTextNode,
    TextNode,
} from 'lexical'

export type SerializedMentionNode = Spread<{
    mentionName: string;
    type: 'mention';
    version: 1;
},
    SerializedTextNode>;

function convertMentionElement(
    domNode: HTMLElement,
): DOMConversionOutput | null {
    const textContent = domNode.textContent

    if (textContent !== null) {
        const node = $createMentionNode(textContent)
        return {
            node,
        }
    }

    return null
}

const mentionStyle = 'background-color: rgba(24, 119, 232, 0.2)'

export class MentionNode extends TextNode {
    __mention: string

    static override getType(): string {
        return 'mention'
    }

    static override clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__mention, node.__text, node.__key)
    }

    static override importJSON(serializedNode: SerializedMentionNode): MentionNode {
        const node = $createMentionNode(serializedNode.mentionName)
        node.setTextContent(serializedNode.text)
        node.setFormat(serializedNode.format)
        node.setDetail(serializedNode.detail)
        node.setMode(serializedNode.mode)
        node.setStyle(serializedNode.style)
        return node
    }

    constructor(mentionName: string, text?: string, key?: NodeKey) {
        super(text ?? mentionName, key)
        this.__mention = mentionName
    }

    override exportJSON(): SerializedMentionNode {
        return {
            ...super.exportJSON(),
            mentionName: this.__mention,
            type: 'mention',
            version: 1,
        }
    }

    override createDOM(config: EditorConfig): HTMLElement {
        const dom = super.createDOM(config)
        dom.style.cssText = mentionStyle
        dom.className = 'mention'
        return dom
    }

    override exportDOM(): DOMExportOutput {
        const element = document.createElement('span')
        element.setAttribute('data-lexical-mention', 'true')
        element.textContent = this.__text
        return {element}
    }

    static override importDOM(): DOMConversionMap | null {
        return {
            span: (domNode: HTMLElement) => {
                if (!domNode.hasAttribute('data-lexical-mention')) {
                    return null
                }
                return {
                    conversion: convertMentionElement,
                    priority: 1,
                }
            },
        }
    }

    override isTextEntity(): true {
        return true
    }
}

export function $createMentionNode(mentionName: string): MentionNode {
    const mentionNode = new MentionNode(mentionName)
    mentionNode.setMode('segmented').toggleDirectionless()
    return mentionNode
}

export function $isMentionNode(
    node: LexicalNode | null | undefined,
): node is MentionNode {
    return node instanceof MentionNode
}
