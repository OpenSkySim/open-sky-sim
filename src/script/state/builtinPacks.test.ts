import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergePackLists } from './builtinPacks';

describe('mergePackLists', () => {
    const builtin = [{ id: 'lp_yak44', packUrl: 'assets/packs/lp_yak44.aircraft.pack' }];

    it('keeps the built-in packs without a modserver', () => {
        assert.deepEqual(mergePackLists([], builtin), builtin);
    });

    it('lets a served pack replace the built-in one of the same id', () => {
        const served = [{ id: 'lp_yak44', packUrl: '/api/aircraft-packs/lp_yak44' }, { id: 'f15', packUrl: '/p/f15' }];
        assert.deepEqual(mergePackLists(served, builtin), served);
    });
});
