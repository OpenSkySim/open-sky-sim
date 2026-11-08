import * as THREE from 'three';
import type { SimHitEvent } from '../physics/sim/simTypes';
import type { WreckSource } from '../scene/entities/wreckField';
import { FrameShift } from '../terrain/geodesy';

/**
 * What starts a visual effect, kept so a replay can start it again: the
 * effect code then runs as it did live, from the same trigger at the same
 * moment, instead of the replay showing its state from the end of the flight.
 */
export type EffectEvent =
    /** Gun hits and ground scrapes as the sim reported them (sparks, debris, hit smoke). */
    | { kind: 'hits'; hits: SimHitEvent[] }
    /** An airframe breaking up: the wreck, and every fire, fireball and mark it sets off. */
    | { kind: 'wreck'; src: WreckSource }
    /** The pinned smoke plume over a crash site. */
    | { kind: 'crashPlume'; targetId: string };

/** A copy the log owns: re-basing moves its points, and the caller's objects stay put. */
export function copyEffectEvent(e: EffectEvent): EffectEvent {
    switch (e.kind) {
        case 'hits':
            return {
                kind: 'hits',
                hits: e.hits.map(h => ({ ...h, position: [...h.position], velocity: [...h.velocity] })),
            };
        case 'wreck': {
            const s = e.src;
            return {
                kind: 'wreck',
                src: {
                    ...s,
                    position: s.position.clone(),
                    quaternion: s.quaternion.clone(),
                    scale: s.scale.clone(),
                    velocity: s.velocity.clone(),
                    cockpit: s.cockpit?.clone(),
                    parts: s.parts.map(p => ({ ...p, position: p.position.clone(), quaternion: p.quaternion.clone() })),
                },
            };
        }
        case 'crashPlume':
            return { ...e };
    }
}

/** Effect triggers in time order, on the flight recorder's clock. */
export class EffectEventLog {
    private events: { t: number; e: EffectEvent }[] = [];
    private head = 0;

    get length(): number {
        return this.events.length - this.head;
    }

    /** Time of the oldest event kept, or undefined when there is none. */
    get firstTime(): number | undefined {
        return this.head < this.events.length ? this.events[this.head].t : undefined;
    }

    clear(): void {
        this.events = [];
        this.head = 0;
    }

    /** Keep `e` (copied) at time `t`; `t` never runs backwards. */
    push(t: number, e: EffectEvent): void {
        const last = this.events[this.events.length - 1];
        this.events.push({ t: last ? Math.max(t, last.t) : t, e: copyEffectEvent(e) });
    }

    trimBefore(t: number): void {
        while (this.head < this.events.length && this.events[this.head].t < t) {
            this.head++;
        }
        if (this.head > 256 && this.head * 2 > this.events.length) {
            this.events = this.events.slice(this.head);
            this.head = 0;
        }
    }

    /** Hand every event with `from < t <= to` to `fn`, oldest first. */
    forEachBetween(from: number, to: number, fn: (e: EffectEvent, t: number) => void): void {
        // First event after `from`.
        let lo = this.head;
        let hi = this.events.length;
        while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (this.events[mid].t <= from) lo = mid + 1; else hi = mid;
        }
        for (let i = lo; i < this.events.length && this.events[i].t <= to; i++) {
            fn(this.events[i].e, this.events[i].t);
        }
    }

    /** Carry every stored point across a floating-origin re-base. */
    rebase(shift: FrameShift): void {
        const p = new THREE.Vector3();
        for (let i = this.head; i < this.events.length; i++) {
            const e = this.events[i].e;
            if (e.kind === 'hits') {
                for (const h of e.hits) {
                    shift.point(p.fromArray(h.position));
                    h.position = [p.x, p.y, p.z];
                    shift.vector(p.fromArray(h.velocity));
                    h.velocity = [p.x, p.y, p.z];
                }
            } else if (e.kind === 'wreck') {
                const s = e.src;
                shift.point(s.position);
                shift.orientation(s.quaternion);
                shift.vector(s.velocity);
                for (const part of s.parts) {
                    shift.point(part.position);
                    shift.orientation(part.quaternion);
                }
            }
        }
    }
}
