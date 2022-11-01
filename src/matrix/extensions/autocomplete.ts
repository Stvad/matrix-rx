import {StateEvent} from '../types/Api'

export interface AutocompleteConfigurationEvent extends StateEvent {
   content: {
       pageNames: string[]
   }
   type: 'matrix-rx.autocomplete'
}
