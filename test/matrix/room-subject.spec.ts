import {describe, expect, it} from 'vitest'
import {mock} from 'vitest-mock-extended'

import {Matrix, RoomSubject} from '../../src'
import {firstValueFrom, of} from 'rxjs'
import * as roomData from '../data/sync/room'

describe('RoomSubject', () => {
    describe('state derivation', () => {
        // todo this probs better ar eventSubject test (mock sync vs ajax)
        const matrix = mock<Matrix>()
        matrix.sync.mockReturnValue(of(roomData.initial))

        it('should derive the name of the room', async () => {
            const subject = new RoomSubject({id: roomData.id, matrix})

            const room = await firstValueFrom(subject)
            expect(room.name).toBe('General6')
        })

    })
})



