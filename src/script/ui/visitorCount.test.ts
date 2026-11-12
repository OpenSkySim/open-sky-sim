import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    UNIQUE_PATH, VISITS_PATH, claimFirstVisit, counterUrl, fetchCounterTotal, formatVisitorLine, parseCounterTotal, shouldRecordVisit,
} from './visitorCount';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
    const items = new Map<string, string>();
    return {
        getItem: key => items.get(key) ?? null,
        setItem: (key, value) => { items.set(key, value); },
    };
}

describe('visitorCount', () => {
    it('records only on the live site', () => {
        assert.equal(shouldRecordVisit('openskysim.github.io'), true);
        assert.equal(shouldRecordVisit('localhost'), false);
        assert.equal(shouldRecordVisit('127.0.0.1'), false);
        assert.equal(shouldRecordVisit('christianschwarz.github.io'), false);
    });

    it('builds per-path counter URLs', () => {
        assert.equal(counterUrl(VISITS_PATH), 'https://openskysim.goatcounter.com/counter/%2Fopen-sky-sim%2F.json');
        assert.equal(counterUrl(UNIQUE_PATH), 'https://openskysim.goatcounter.com/counter/%2Fopen-sky-sim%2Funique-visitor.json');
    });

    it('reads GoatCounter counts in any locale format', () => {
        assert.equal(parseCounterTotal({ count: '1,234' }), 1234);
        assert.equal(parseCounterTotal({ count: '1 234' }), 1234);
        assert.equal(parseCounterTotal({ count: '1 234' }), 1234);
        assert.equal(parseCounterTotal({ count: '7' }), 7);
        assert.equal(parseCounterTotal({ count: 42 }), 42);
    });

    it('rejects anything that is not a count', () => {
        assert.equal(parseCounterTotal(null), undefined);
        assert.equal(parseCounterTotal('1234'), undefined);
        assert.equal(parseCounterTotal({}), undefined);
        assert.equal(parseCounterTotal({ count: '' }), undefined);
        assert.equal(parseCounterTotal({ count: 'n/a' }), undefined);
        assert.equal(parseCounterTotal({ count: -3 }), undefined);
    });

    it('formats whichever counts arrived', () => {
        assert.equal(formatVisitorLine(1234, 5678, 'en-US'), '1,234 unique visitors · 5,678 visits');
        assert.equal(formatVisitorLine(1, 1, 'en-US'), '1 unique visitor · 1 visit');
        assert.equal(formatVisitorLine(undefined, 9, 'en-US'), '9 visits');
        assert.equal(formatVisitorLine(3, undefined, 'en-US'), '3 unique visitors');
        assert.equal(formatVisitorLine(undefined, undefined), undefined);
    });

    it('claims the unique visit once per browser', () => {
        const storage = memoryStorage();
        assert.equal(claimFirstVisit(storage), true);
        assert.equal(claimFirstVisit(storage), false);
    });

    it('never claims without working storage', () => {
        assert.equal(claimFirstVisit(undefined), false);
        const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => undefined };
        assert.equal(claimFirstVisit(throwing), false);
        const dropping = { getItem: () => null, setItem: () => undefined };
        assert.equal(claimFirstVisit(dropping), false);
    });

    it('gives undefined when the request fails, is refused or is too slow', async () => {
        const failing = (async () => { throw new TypeError('blocked'); }) as typeof fetch;
        assert.equal(await fetchCounterTotal(VISITS_PATH, failing), undefined);

        const refused = (async () => new Response('forbidden', { status: 403 })) as typeof fetch;
        assert.equal(await fetchCounterTotal(VISITS_PATH, refused), undefined);

        const slow = ((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        })) as typeof fetch;
        assert.equal(await fetchCounterTotal(VISITS_PATH, slow, 20), undefined);
    });

    it('reads a good answer, and a never-recorded path as 0', async () => {
        const ok = (async () => new Response(JSON.stringify({ count: '3,210' }), { status: 200 })) as typeof fetch;
        assert.equal(await fetchCounterTotal(VISITS_PATH, ok), 3210);

        const unseen = (async () => new Response('{"count_unique":"0", "count":"0"}', { status: 404 })) as typeof fetch;
        assert.equal(await fetchCounterTotal(UNIQUE_PATH, unseen), 0);
    });
});
