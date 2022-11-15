// from
// https://raw.githubusercontent.com/facebook/lexical/89a4593cc0fd213f1a5655f464461a4d2d43c294/packages/lexical-playground/src/nodes/MentionNode.ts

import type {Spread} from 'lexical'
import {$createTextNode, EditorConfig, LexicalNode, NodeKey} from 'lexical'
import {LinkNode, SerializedLinkNode} from '@lexical/link'

export type SerializedMentionNode = Spread<{
    mention: MentionNodeProps;
    type: 'mention';
    version: 1;
},
    SerializedLinkNode>;

const mentionStyle = 'background-color: rgba(24, 119, 232, 0.2)'

export interface MentionNodeProps {
    id: string;
    text: string;
    url: string;
    details?: string;
}

interface LinkAttributes {
    target?: null | string;
    rel?: null | string;
}


// @ts-ignore todo: is there a proper way to extend nodes so types are compatible?
export class MentionNode extends LinkNode {
    __mention: MentionNodeProps

    static override getType(): string {
        return 'mention'
    }

    static override clone(node: MentionNode): MentionNode {
        return new MentionNode(node.__mention, {rel: node.__rel, target: node.__target}, node.__key)
    }

    static override importJSON(serializedNode: SerializedMentionNode): MentionNode {
        const node = $createMentionNode(serializedNode.mention, {
            rel: serializedNode.rel,
            target: serializedNode.target,
        })
        node.setFormat(serializedNode.format)
        node.setIndent(serializedNode.indent)
        node.setDirection(serializedNode.direction)
        return node
    }

    constructor(
        mention: MentionNodeProps,
        attributes: LinkAttributes = {target: '_blank'},
        key?: NodeKey,
    ) {
        super(mention.url, attributes, key)
        this.__mention = mention
    }

    // override exportJSON(): SerializedMentionNode {
    //     return {
    //         ...super.exportJSON(),
    //         mention: this.__mention,
    //         type: 'mention',
    //         version: 1,
    //     }
    // }

    override createDOM(config: EditorConfig): HTMLAnchorElement {
        const dom = super.createDOM(config)
        dom.style.cssText = mentionStyle
        dom.className = 'mention'
        dom.id = this.__mention.id
        dom.title = this.__mention.details ?? ''

        return dom
    }

    // static override importDOM(): DOMConversionMap | null {
    //     // todo for editing messages
    //     console.log('importDOM')
    // }
}

export function $createMentionNode(mention: MentionNodeProps, attributes?: LinkAttributes): MentionNode {
    const mentionNode = new MentionNode(mention, attributes)
    // doing this in the constructor causes an infinite recursion =\
    mentionNode.append($createTextNode(mention.text))
    return mentionNode
}

export function $isMentionNode(
    node: LexicalNode | null | undefined,
): node is MentionNode {
    return node instanceof MentionNode
}
