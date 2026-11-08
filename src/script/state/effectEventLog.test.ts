import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { EffectEvent, EffectEventLog } from './effectEventLog';
import type { WreckSource } from '../scene/entities/wreckField';

function hit(x: number): EffectEvent {
    return { kind: 'hits', hits: [{ position: [x, 0, 0], velocity: [1, 0, 0], targetId: 'ai0', damage: 5 }] };
}

function wreck(): EffectEvent {
    const src = {
        id: 'ai0', body: {} as WreckSource['body'],
        position: new THREE.Vector3(10, 0, 0), quaternion: new THREE.Quaternion(),
        scale: new THREE.Vector3(1, 1, 1), velocity: new THREE.Vector3(0, -50, 0),
        parts: [{ model: {} as WreckSource['body'], position: new THREE.Vector3(10, 1, 0), quaternion: new THREE.Quaternion(), kind: 'gear' as const }],
    } satisfies WreckSource;
    return { kind: 'wreck', src };
}

const times = (log: EffectEventLog, from: number, to: number) => {
    const out: number[] = [];
    log.forEachBetween(from, to, (_e, t) => out.push(t));
    return out;
};

describe('EffectEventLog', () => {
    it('hands over events in (from, to], oldest first', () => {
        const log = new EffectEventLog();
        log.push(1, hit(0));
        log.push(2, hit(0));
        log.push(2, hit(0));
        log.push(3, hit(0));
        assert.deepEqual(times(log, 1, 2), [2, 2]);
        assert.deepEqual(times(log, 0, 1), [1]);
        assert.deepEqual(times(log, 2, 2.5), []);
        assert.deepEqual(times(log, -1, 10), [1, 2, 2, 3]);
    });

    it('never lets time run backwards', () => {
        const log = new EffectEventLog();
        log.push(5, hit(0));
        log.push(4, hit(0)); // stamped late: kept at 5
        assert.deepEqual(times(log, 4.5, 5), [5, 5]);
    });

    it('keeps its own copies', () => {
        const log = new EffectEventLog();
        const e = hit(7);
        log.push(1, e);
        if (e.kind === 'hits') e.hits[0].position[0] = 999;
        const w = wreck();
        log.push(2, w);
        if (w.kind === 'wreck') w.src.position.x = 999;
        log.forEachBetween(0, 3, ev => {
            if (ev.kind === 'hits') assert.equal(ev.hits[0].position[0], 7);
            if (ev.kind === 'wreck') assert.equal(ev.src.position.x, 10);
        });
    });

    it('trims and re-bases', () => {
        const log = new EffectEventLog();
        for (let i = 0; i < 600; i++) log.push(i, i % 2 ? hit(i) : wreck());
        log.trimBefore(500);
        assert.equal(log.length, 100);
        assert.equal(log.firstTime, 500);
        const shift = {
            point: (v: THREE.Vector3) => v.set(v.x - 1000, v.y, v.z),
            orientation: (q: THREE.Quaternion) => q,
            vector: (v: THREE.Vector3) => v,
        };
        log.rebase(shift as never);
        log.forEachBetween(500.5, 501, ev => {
            assert.equal(ev.kind, 'hits');
            if (ev.kind === 'hits') assert.equal(ev.hits[0].position[0], 501 - 1000);
        });
        log.forEachBetween(501.5, 502, ev => {
            if (ev.kind === 'wreck') {
                assert.equal(ev.src.position.x, -990);
                assert.equal(ev.src.parts[0].position.x, -990);
            }
        });
    });
});
