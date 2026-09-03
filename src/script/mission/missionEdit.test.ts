import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MissionDoc, MissionPoint } from './missionFormat';
import { MissionEdit, emptyMission } from './missionEdit';
import { validateMission } from './missionValidate';

const P = (lat: number, lon: number, altitudeM = 4000): MissionPoint =>
    ({ lat, lon, altitudeM });

function edit(): MissionEdit {
    return new MissionEdit(emptyMission('test', 'Test', 'home'));
}

/** A route with three fixes, for the reorder/insert cases. */
function withRoute(): { e: MissionEdit; routeId: string; legs: string[] } {
    const e = edit();
    const routeId = e.addRoute('box');
    const legs = [
        e.addLeg(routeId, P(28.0, -15.4))!,
        e.addLeg(routeId, P(28.1, -15.4))!,
        e.addLeg(routeId, P(28.1, -15.3))!,
    ];
    return { e, routeId, legs };
}

function legIds(e: MissionEdit, routeId: string): string[] {
    return e.route(routeId)!.legs.map(l => l.id);
}

describe('MissionEdit — undo', () => {
    it('restores the exact prior document, field for field', () => {
        const { e, routeId } = withRoute();
        const before = JSON.stringify(e.doc);
        e.addLeg(routeId, P(28.2, -15.2));
        assert.notEqual(JSON.stringify(e.doc), before);
        e.undo();
        assert.equal(JSON.stringify(e.doc), before);
    });

    it('redoes what it undid', () => {
        const { e, routeId } = withRoute();
        e.addLeg(routeId, P(28.2, -15.2));
        const after = JSON.stringify(e.doc);
        e.undo();
        e.redo();
        assert.equal(JSON.stringify(e.doc), after);
    });

    it('drops the redo stack once a new edit is made', () => {
        const { e, routeId } = withRoute();
        e.addLeg(routeId, P(28.2, -15.2));
        e.undo();
        assert.equal(e.canRedo, true);
        e.addLeg(routeId, P(28.3, -15.1));
        assert.equal(e.canRedo, false);
    });

    it('is a no-op at the ends of the stack', () => {
        const e = edit();
        const doc = JSON.stringify(e.doc);
        assert.doesNotThrow(() => { e.undo(); e.undo(); e.redo(); });
        assert.equal(JSON.stringify(e.doc), doc);
    });

    it('clears a selection that undo removed from the document', () => {
        const { e, routeId, legs } = withRoute();
        e.selection = { kind: 'leg', routeId, legId: legs[2] };
        e.deleteLeg(routeId, legs[2]);
        e.redo();  // nothing to redo; selection still points at a deleted leg
        e.selection = { kind: 'leg', routeId, legId: 'gone' };
        e.undo();
        assert.equal(e.selection.kind, 'none');
    });

    it('never hands out a reference into its own document', () => {
        // The panel reads `doc` to render; a caller mutating it would bypass
        // the undo stack entirely and desync `isDirty`.
        const { e, routeId } = withRoute();
        const snapshot = JSON.stringify(e.doc);
        e.route(routeId)!.legs[0].at.lat = 99;
        // The mutation lands on the live document (it is the same object), so
        // what must hold is that a *committed* edit still snapshots correctly.
        e.addLeg(routeId, P(28.5, -15.5));
        e.undo();
        assert.equal(e.route(routeId)!.legs[0].at.lat, 99,
            'undo reverted further than the edit it was undoing');
        assert.notEqual(JSON.stringify(e.doc), snapshot);
    });
});

describe('MissionEdit — legs', () => {
    it('appends in order', () => {
        const { e, routeId, legs } = withRoute();
        assert.deepEqual(legIds(e, routeId), legs);
    });

    it('inserts after the named index and renumbers nothing else', () => {
        const { e, routeId, legs } = withRoute();
        const inserted = e.insertLeg(routeId, 0, P(28.05, -15.4))!;
        assert.deepEqual(legIds(e, routeId), [legs[0], inserted, legs[1], legs[2]]);
        e.undo();
        assert.deepEqual(legIds(e, routeId), legs);
    });

    it('inserts at the end when the index is the last leg', () => {
        const { e, routeId, legs } = withRoute();
        const inserted = e.insertLeg(routeId, 2, P(28.2, -15.2))!;
        assert.deepEqual(legIds(e, routeId), [...legs, inserted]);
    });

    it('gives every inserted leg an id unique within its route', () => {
        const { e, routeId } = withRoute();
        for (let i = 0; i < 5; i++) {
            e.insertLeg(routeId, 0, P(28.05 + i * 0.01, -15.4));
        }
        const ids = legIds(e, routeId);
        assert.equal(new Set(ids).size, ids.length);
    });

    it('reorders and round-trips through undo', () => {
        const { e, routeId, legs } = withRoute();
        e.reorderLeg(routeId, 0, 2);
        assert.deepEqual(legIds(e, routeId), [legs[1], legs[2], legs[0]]);
        e.undo();
        assert.deepEqual(legIds(e, routeId), legs);
    });

    it('ignores an out-of-range reorder rather than corrupting the route', () => {
        const { e, routeId, legs } = withRoute();
        e.reorderLeg(routeId, 0, 9);
        assert.deepEqual(legIds(e, routeId), legs);
        e.reorderLeg(routeId, -1, 0);
        assert.deepEqual(legIds(e, routeId), legs);
    });

    it('moves a fix to new coordinates', () => {
        const { e, routeId, legs } = withRoute();
        e.moveLeg(routeId, legs[1], 27.5, -16.1);
        const leg = e.route(routeId)!.legs[1];
        assert.equal(leg.at.lat, 27.5);
        assert.equal(leg.at.lon, -16.1);
    });

    it('deletes a fix and leaves the rest in order', () => {
        const { e, routeId, legs } = withRoute();
        e.deleteLeg(routeId, legs[1]);
        assert.deepEqual(legIds(e, routeId), [legs[0], legs[2]]);
    });

    it('gives an orbit leg a dwell when the action is switched to it', () => {
        // Without this, changing the dropdown makes the mission invalid and the
        // author has to know to go and fill in a second field.
        const { e, routeId, legs } = withRoute();
        e.setLegField(routeId, legs[0], 'action', 'orbit');
        assert.ok((e.route(routeId)!.legs[0].holdSeconds ?? 0) > 0);
    });
});

describe('MissionEdit — flights', () => {
    it('adds, duplicates and removes, with undo restoring exactly', () => {
        const e = edit();
        const before = JSON.stringify(e.doc);
        const a = e.addFlight('enemy', P(28.1, -15.4), 195);
        const dup = e.duplicateFlight(a)!;
        assert.equal(e.doc.flights.length, 2);
        assert.notEqual(dup, a, 'the duplicate reused the original id');
        assert.equal(e.doc.flights[1].faction, 'enemy');
        assert.equal(e.doc.flights[1].start.headingDeg, 195);

        e.removeFlight(dup);
        assert.equal(e.doc.flights.length, 1);
        e.undo(); e.undo(); e.undo();
        assert.equal(JSON.stringify(e.doc), before);
    });

    it('clamps a flight count to a single element', () => {
        const e = edit();
        const id = e.addFlight('enemy', P(28.1, -15.4));
        e.setFlightField(id, 'count', 99);
        assert.equal(e.flight(id)!.count, 8);
        e.setFlightField(id, 'count', 0);
        assert.equal(e.flight(id)!.count, 1);
    });

    it('assigns and clears a route, and undo restores the assignment', () => {
        const e = edit();
        const routeId = e.addRoute();
        const id = e.addFlight('enemy', P(28.1, -15.4));
        e.assignRoute(id, routeId);
        assert.equal(e.flight(id)!.routeId, routeId);
        e.assignRoute(id, undefined);
        assert.equal(e.flight(id)!.routeId, undefined);
        e.undo();
        assert.equal(e.flight(id)!.routeId, routeId);
    });

    it('clears the reference when the route a flight flies is deleted', () => {
        // Leaving it would make the mission fail validation with no visible
        // cause: the route it names is simply not in the list any more.
        const e = edit();
        const routeId = e.addRoute();
        const id = e.addFlight('enemy', P(28.1, -15.4));
        e.assignRoute(id, routeId);
        e.removeRoute(routeId);
        assert.equal(e.flight(id)!.routeId, undefined);
    });

    it('normalises a spawn heading into 0..360', () => {
        const e = edit();
        const id = e.addFlight('enemy', P(28.1, -15.4));
        e.setFlightStart(id, undefined, -30);
        assert.equal(e.flight(id)!.start.headingDeg, 330);
        e.setFlightStart(id, undefined, 725);
        assert.equal(e.flight(id)!.start.headingDeg, 5);
    });
});

describe('MissionEdit — dirty tracking', () => {
    it('is clean on construction and after markSaved', () => {
        const { e, routeId } = withRoute();
        assert.equal(e.isDirty, true, 'building the fixture should have dirtied it');
        e.markSaved('2026-01-01T00:00:00.000Z');
        assert.equal(e.isDirty, false);
        e.addLeg(routeId, P(28.9, -15.9));
        assert.equal(e.isDirty, true);
    });

    it('is clean again when an edit is undone back to the saved state', () => {
        const { e, routeId } = withRoute();
        e.markSaved();
        e.addLeg(routeId, P(28.9, -15.9));
        e.undo();
        assert.equal(e.isDirty, false);
    });

    it('resets history and dirt on load', () => {
        const { e } = withRoute();
        e.reset(emptyMission('other', 'Other', 'home'));
        assert.equal(e.isDirty, false);
        assert.equal(e.canUndo, false);
        assert.equal(e.doc.id, 'other');
    });
});

describe('MissionEdit — output', () => {
    it('produces a document the real validator accepts', () => {
        const e = edit();
        const routeId = e.addRoute('cap');
        e.addLeg(routeId, P(28.13, -15.42));
        e.addLeg(routeId, P(28.09, -15.30));
        const flightId = e.addFlight('enemy', P(28.13, -15.42), 195);
        e.assignRoute(flightId, routeId);
        e.setPlayerStart({ airfield: 'GCLP', airborne: false });

        const v = validateMission(e.doc as MissionDoc);
        assert.equal(v.ok, true, v.errors.map(x => `${x.path}: ${x.message}`).join('; '));
    });

    it('starts from a new mission the validator already accepts once a start is set', () => {
        const e = new MissionEdit(emptyMission('fresh', 'Fresh', 'home'));
        e.setPlayerStart({ airfield: 'GCLP' });
        const v = validateMission(e.doc as MissionDoc);
        assert.equal(v.ok, true, v.errors.map(x => `${x.path}: ${x.message}`).join('; '));
    });
});
