/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// From
//https://raw.githubusercontent.com/facebook/lexical/89a4593cc0fd213f1a5655f464461a4d2d43c294/packages/lexical-playground/src/plugins/MentionsPlugin/index.tsx

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {
    LexicalTypeaheadMenuPlugin,
    QueryMatch,
    TypeaheadOption,
    useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {TextNode} from 'lexical'
import * as React from 'react'
import {useCallback, useMemo, useState} from 'react'
import * as ReactDOM from 'react-dom'

import {$createMentionNode, MentionNodeProps} from '../nodes/mention'
import {AutocompleteSuggestion} from '../../../matrix/extensions/autocomplete'

const PUNCTUATION =
    '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%\'"~=<>_:;'
const NAME = '\\b[A-Z][^\\s' + PUNCTUATION + ']'

const DocumentMentionsRegex = {
    NAME,
    PUNCTUATION,
}

const PUNC = DocumentMentionsRegex.PUNCTUATION

const TRIGGERS = ['#'].join('')

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = '[^' + TRIGGERS + PUNC + '\\s]'

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
    '(?:' +
    '\\.[ |$]|' + // E.g. "r. " in "Mr. Smith"
    ' |' + // E.g. " " in "Josh Duck"
    '[' +
    PUNC +
    ']|' + // E.g. "-' in "Salier-Hellendag"
    ')'

const LENGTH_LIMIT = 75

const AtSignMentionsRegex = new RegExp(
    '(^|\\s|\\()(' +
    '[' +
    TRIGGERS +
    ']' +
    '((?:' +
    VALID_CHARS +
    VALID_JOINS +
    '){0,' +
    LENGTH_LIMIT +
    '})' +
    ')$',
)

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
    `(^|\\s|\\()([${TRIGGERS}]((?:${VALID_CHARS}){0,${ALIAS_LENGTH_LIMIT}}))$`,
)

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 7


function checkForAtSignMentions(
    text: string,
    minMatchLength: number,
): QueryMatch | null {
    let match = AtSignMentionsRegex.exec(text)

    if (match === null) {
        match = AtSignMentionsRegexAliasRegex.exec(text)
    }
    if (match !== null) {
        // The strategy ignores leading whitespace but we need to know it's
        // length to add it to the leadOffset
        const maybeLeadingWhitespace = match[1]

        const matchingString = match[3]
        if (matchingString.length >= minMatchLength) {
            return {
                leadOffset: match.index + maybeLeadingWhitespace.length,
                matchingString,
                replaceableString: match[2],
            }
        }
    }
    return null
}

function getPossibleQueryMatch(text: string): QueryMatch | null {
    return checkForAtSignMentions(text, 1)
}

class MentionTypeaheadOption extends TypeaheadOption {
    constructor(public mention: MentionNodeProps) {
        super(mention.id)
    }

    get text(): string {
        return this.mention.text
    }
}

function MentionsTypeaheadMenuItem({
                                       index,
                                       isSelected,
                                       onClick,
                                       onMouseEnter,
                                       option,
                                   }: {
    index: number;
    isSelected: boolean;
    onClick: () => void;
    onMouseEnter: () => void;
    option: MentionTypeaheadOption;
}) {
    let className = 'item'
    if (isSelected) {
        className += ' selected'
    }
    return (
        <li
            key={option.key}
            tabIndex={-1}
            className={className}
            ref={option.setRefElement}
            role="option"
            aria-selected={isSelected}
            id={'typeahead-item-' + index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}>
            <span className="text">{option.text}</span>
        </li>
    )
}

interface MentionsPluginProps {
    suggestions: AutocompleteSuggestion[]
}

export function MentionsPlugin({suggestions}: MentionsPluginProps): JSX.Element | null {
    const [editor] = useLexicalComposerContext()

    const [queryString, setQueryString] = useState<string | null>(null)

    const results = suggestions.filter(mention =>
        mention.text?.toLowerCase().includes(queryString?.toLowerCase()))

    const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
        minLength: 0,
    })

    const options = useMemo(
        () =>
            results
                .map(
                    (result) =>
                        new MentionTypeaheadOption({
                            id: result.id,
                            text: result.text,
                            details: result.summary,
                            // todo hardcoded
                            url: `https://roamresearch.com/#/app/tools/page/${result.id}`,
                        }),
                )
                .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
        [results],
    )

    const onSelectOption = useCallback(
        (
            selectedOption: MentionTypeaheadOption,
            nodeToReplace: TextNode | null,
            closeMenu: () => void,
        ) => {
            editor.update(() => {
                const mentionNode = $createMentionNode(selectedOption.mention)
                if (nodeToReplace) {
                    nodeToReplace.replace(mentionNode)
                }
                mentionNode.select()
                closeMenu()
            })
        },
        [editor],
    )

    const checkForMentionMatch = useCallback(
        (text: string) => {
            const mentionMatch = getPossibleQueryMatch(text)
            const slashMatch = checkForSlashTriggerMatch(text, editor)
            return !slashMatch && mentionMatch ? mentionMatch : null
        },
        [checkForSlashTriggerMatch, editor],
    )

    return (
        <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
            onQueryChange={setQueryString}
            onSelectOption={onSelectOption}
            triggerFn={checkForMentionMatch}
            options={options}
            menuRenderFn={(
                anchorElementRef,
                {selectedIndex, selectOptionAndCleanUp, setHighlightedIndex},
            ) =>
                anchorElementRef.current && results.length
                    ? ReactDOM.createPortal(
                        <div className="typeahead-popover mentions-menu">
                            <ul>
                                {options.map((option, i: number) => (
                                    <MentionsTypeaheadMenuItem
                                        index={i}
                                        isSelected={selectedIndex === i}
                                        onClick={() => {
                                            setHighlightedIndex(i)
                                            selectOptionAndCleanUp(option)
                                        }}
                                        onMouseEnter={() => {
                                            setHighlightedIndex(i)
                                        }}
                                        key={option.key}
                                        option={option}
                                    />
                                ))}
                            </ul>
                        </div>,
                        anchorElementRef.current,
                    )
                    : null
            }
        />
    )
}
