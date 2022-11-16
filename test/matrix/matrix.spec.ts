import {describe, expect, it, vi} from 'vitest'
import { mock } from 'vitest-mock-extended';

import {Matrix} from '../../src'
import {asyncScheduler, delay, firstValueFrom, of, scheduled} from 'rxjs'
import * as roomData from '../data/sync/room'
import {credentials} from '../data'
import {AjaxCreationMethod} from 'rxjs/internal/ajax/ajax'

describe('matrix', () => {
    describe('initial sync', () => {
        it('should derive the name of the room', async () => {
            const restrx = mock<AjaxCreationMethod>()
            restrx.getJSON.mockReturnValue(scheduled(of(roomData.initial), asyncScheduler))

            const matrix = new Matrix(credentials, restrx)

            const room = await firstValueFrom(matrix.room(roomData.id))
            expect(room.name).toBe('General6')
        })
    })
})



