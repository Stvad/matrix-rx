import {StateEvent} from '../types/Api'

export interface AutocompleteSuggestion {
    id: string,
    text: string,
    summary: string,
    url?: string,
}

export interface AutocompleteConfigurationEvent extends StateEvent {
    content: {
        pages: AutocompleteSuggestion[]
        urlPattern: string
    }
    type: 'matrix-rx.autocomplete'
}
