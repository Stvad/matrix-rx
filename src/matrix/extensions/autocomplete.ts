import {StateEvent} from '../types/Api'

export interface AutocompleteSuggestion {
    id: string,
    text: string,
    summary: string,
}

export interface AutocompleteConfigurationEvent extends StateEvent {
   content: {
       pages: AutocompleteSuggestion[]
   }
   type: 'matrix-rx.autocomplete'
}
