import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fetchVisitorTotal, formatVisitorLine, parseCounterTotal, shouldRecordVisit } from './visitorCount';

describe('visitorCount', () => {
    it('records only on the live site', () => {
        assert.equal(shouldRecordVisit('openskysim.github.io'), true);
        assert.equal(shouldRecordVisit('localhost'), false);
        assert.equal(shouldRecordVisit('127.0.0.1'), false);
        assert.equal(shouldRecordVisit('christianschwarz.github.io'), false);
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

    it('formats the line', () => {
        assert.equal(formatVisitorLine(12345, 'en-US'), '12,345 visits so far');
        assert.equal(formatVisitorLine(1, 'en-US'), '1 visit so far');
    });

    it('gives undefined when the request fails, is refused or is too slow', async () => {
        const failing = (async () => { throw new TypeError('blocked'); }) as typeof fetch;
        assert.equal(await fetchVisitorTotal(failing), undefined);

        const refused = (async () => new Response('forbidden', { status: 403 })) as typeof fetch;
        assert.equal(await fetchVisitorTotal(refused), undefined);

        const slow = ((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        })) as typeof fetch;
        assert.equal(await fetchVisitorTotal(slow, 20), undefined);
    });

    it('gives the total from a good answer', async () => {
        const ok = (async () => new Response(JSON.stringify({ count: '3,210' }), { status: 200 })) as typeof fetch;
        assert.equal(await fetchVisitorTotal(ok), 3210);
    });
});
