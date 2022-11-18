import {beforeEach, describe, expect, it} from 'vitest'
import {mock} from 'vitest-mock-extended'

import {EventSubject, Matrix, RoomSubject} from '../../src'
import {firstValueFrom, lastValueFrom, of, take, tap} from 'rxjs'
import * as roomData from '../data/sync/room'
import {loadEventsResponse, sinceEventId} from '../data/sync/events'

declare global {
    export namespace Chai {
        interface Assertion {
            toHaveUniqueMembers<T>(key?: (item: T) => string);
        }
    }
}

expect.extend({
    toHaveUniqueMembers<T, K = T>(received: T[], key: (item: T | K) => K = (item: T) => item as unknown as K) {
        const hasDuplicates = new Set(received.map(key)).size !== received.length
        return {
            pass: !hasDuplicates,
            message: () => hasDuplicates ?
                `expected ${received} to have unique members but it had duplicates` :
                'collection only had unique members',
        }
    },
})

describe('RoomSubject', () => {
    describe('state derivation', () => {
        // todo what happens when the room does not exist in the sync response?
        // afaik it returns any values and keeps trying to sync, which is probably not what we want
        // at the same time, intermediate sync results can be empty, so we need to handle that
        // but if there is no match on initial response - we should throw

        const matrix = mock<Matrix>()
        beforeEach(() => {
            matrix.sync.mockReturnValue(of(roomData.initial))
            matrix.loadEventsSince.mockReturnValue(of(loadEventsResponse))
        })


        it('should derive the name of the room from initial sync message', async () => {
            const subject = new RoomSubject({id: roomData.id, matrix})

            const room = await firstValueFrom(subject)
            expect(room.name).toBe('General6')
        })

        it('name should not be overridden by the arrival of new messages', async () => {
            matrix.sync.mockReturnValue(of(roomData.initial, roomData.incremental))

            const subject = new RoomSubject({id: roomData.id, matrix})

            const room = await lastValueFrom(subject.pipe(tap(it => console.log('tick')),  take(2)))
            expect(room.name).toBe('General6')
        })

        it('should not have duplicate events, event though various input sources may have them', async () => {
            const subject = new RoomSubject({id: roomData.id, matrix, sinceEventId: sinceEventId})

            const room = await firstValueFrom(subject)
            expect(room.messages).toHaveUniqueMembers<EventSubject>(it => it.value.event_id)
        })
    })
})



