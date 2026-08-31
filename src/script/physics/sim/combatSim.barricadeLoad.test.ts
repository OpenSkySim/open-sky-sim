/**
 * The load the webbing puts back on the airframe.
 *
 * The arrestment is split on purpose: the arresting engine's along-deck
 * retardation stays with the tuned run-out, because that is the feel of a trap
 * and nobody wants it drifting. What the engine cannot tell you is *where* the
 * net has hold of you, and that is what these check — an off-centre engagement
 * is loaded sideways and slewed, a centred one is not, and both of those come
 * out of tension on real geometry rather than a formula.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { Faction } from '../../weapons/combatant';
import { FcsPitchLimiter } from '../fm2/fcs';
import { defaultFm2Config } from '../fm2/fm2AircraftConfig';
import { ARRESTOR_CARRIER_ORIGIN, ARRESTOR_DECK_MID_X } from '../../scene/entities/arrestorCables';
import {
    BARRICADE_DECK_LOCAL_Y,
    BARRICADE_LOCAL_Z,
    buildBarricadeField,
} from '../../scene/entities/barricade';
import { CombatSim } from './combatSim';
import { serializeWorld } from './serializedWorld';

const ORIGIN = ARRESTOR_CARRIER_ORIGIN;

const HOOK_UP = {
    pitch: 0, roll: 0, yaw: 0, throttle: 0,
    landingGearDeployed: true,
    flapsExtended: true,
    airbrakesExtended: false,
    hookDeployed: false,
    wheelBrakesApplied: false,
    pitchLimiterMode: FcsPitchLimiter.SOFT,
    limitersEnabled: true,
    wantForceVectors: false,
    firing: false,
} as const;

/** Closed box as a triangle soup, aircraft body frame (+Z out of the nose). */
function box(
    cx: number, cy: number, cz: number,
    hx: number, hy: number, hz: number,
): number[] {
    const x0 = cx - hx, x1 = cx + hx;
    const y0 = cy - hy, y1 = cy + hy;
    const z0 = cz - hz, z1 = cz + hz;
    return [
        x0, y1, z0, x0, y1, z1, x1, y1, z1, x0, y1, z0, x1, y1, z1, x1, y1, z0,
        x0, y0, z0, x1, y0, z0, x1, y0, z1, x0, y0, z0, x1, y0, z1, x0, y0, z1,
        x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z0, x1, y1, z1, x1, y0, z1,
        x0, y0, z0, x0, y0, z1, x0, y1, z1, x0, y0, z0, x0, y1, z1, x0, y1, z0,
        x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y0, z1, x1, y1, z1, x0, y1, z1,
        x0, y0, z0, x0, y1, z0, x1, y1, z0, x0, y0, z0, x1, y1, z0, x1, y0, z0,
    ];
}

/** A fighter's hull: 2.5 m fuselage, 11 m wing. */
const HULL = {
    triangles: [
        ...box(0, 0, 0, 1.25, 1.0, 6.0),
        ...box(0, -0.3, -0.5, 5.5, 0.2, 1.5),
    ],
    aabb: {
        min: [-5.5, -1.0, -6.0] as [number, number, number],
        max: [5.5, 1.0, 6.0] as [number, number, number],
    },
};

function world(deploy = 1) {
    return serializeWorld(
        [], [],
        [{ center: new THREE.Vector3(0, 0, 0), heading: 0, halfLength: 100, halfWidth: 20 }],
        [], [], [], [], [],
        [buildBarricadeField({ position: { ...ORIGIN } }, BARRICADE_DECK_LOCAL_Y, deploy)],
    );
}

/** Wing span of {@link HULL}, the width the webbing has to beat to hold it. */
const WING_SPAN_M = 11;

/** Roll an airframe into the net from `asternM`, `offsetM` off the centreline. */
function run(offsetM: number, frames = 240): {
    lateralTravel: number;
    yaw: number;
    alongDeckLost: number;
    engaged: boolean;
    /** How far across the deck the webbing reaches, at the aircraft's station. */
    panelWidthAtAircraft: number;
} {
    const sim = new CombatSim();
    sim.setWorld(world());
    const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    sim.addAircraft({
        id: 'ac',
        faction: Faction.PLAYER,
        control: 'external',
        kinematic: false,
        aircraftConfig: defaultFm2Config,
        hitRadius: 5,
        maxHealth: 100,
        collision: HULL,
        spawn: {
            position: [
                ORIGIN.x + ARRESTOR_DECK_MID_X + offsetM,
                ORIGIN.y + BARRICADE_DECK_LOCAL_Y + 2.0,
                ORIGIN.z + BARRICADE_LOCAL_Z + 20,
            ],
            quaternion: [quat.x, quat.y, quat.z, quat.w],
            velocity: [0, 0, -60],
            throttle: 0,
            landed: false,
            airborne: false,
        },
        enabled: true,
    });

    const read = () => (sim as unknown as {
        aircraft: Map<string, {
            barricadeEngaged: boolean;
            model: {
                position: THREE.Vector3;
                quaternion: THREE.Quaternion;
                velocityVector: THREE.Vector3;
            };
        }>;
    }).aircraft.get('ac')!;

    const startX = read().model.position.x;
    // Along the deck, not total speed: this harness has no carrier collider
    // under the airframe, so once the net has stopped it the wreck simply
    // falls, and total speed stops being a statement about the arrestment.
    const startAlong = Math.abs(read().model.velocityVector.z);
    let engaged = false;
    for (let i = 0; i < frames; i++) {
        sim.step(1 / 60, { ac: { ...HOOK_UP } });
        if (read().barricadeEngaged) engaged = true;
    }
    const s = read();
    // Heading, read off where the nose ended up pointing.
    const nose = new THREE.Vector3(0, 0, 1).applyQuaternion(s.model.quaternion);
    return {
        lateralTravel: s.model.position.x - startX,
        yaw: Math.atan2(nose.x, -nose.z),
        alongDeckLost: startAlong - Math.abs(s.model.velocityVector.z),
        engaged,
        panelWidthAtAircraft: panelWidthAt(sim, s.model.position),
    };
}

/**
 * How wide the webbing still is where the aircraft actually is.
 *
 * Not the width of the rig: a panel drawn out into a long V is thirty metres of
 * belt and five metres of net by the time it reaches the airframe, and it is
 * the second number that decides whether a wing is caught or waved through.
 */
function panelWidthAt(sim: CombatSim, acWorld: THREE.Vector3): number {
    const inner = sim as unknown as {
        barricadeSolvers: {
            pos: Float64Array; spec: { stripes: number; stripeNodes: number };
            stripeNodeIndex(s: number, j: number): number;
        }[];
        barricades: { originX: number; originY: number; originZ: number; quaternion: THREE.Quaternion }[];
    };
    const solver = inner.barricadeSolvers[0];
    const field = inner.barricades[0];
    if (!solver || !field) return 0;
    const local = acWorld.clone()
        .sub(new THREE.Vector3(field.originX, field.originY, field.originZ))
        .applyQuaternion(field.quaternion.clone().invert());
    let lo = Infinity;
    let hi = -Infinity;
    for (let st = 0; st < solver.spec.stripes; st++) {
        for (let j = 0; j < solver.spec.stripeNodes; j++) {
            const o = solver.stripeNodeIndex(st, j) * 3;
            // Half a fuselage length either side: the webbing that is level with
            // the aircraft, rather than the run trailing back to the stanchions.
            if (Math.abs(solver.pos[o + 2] - local.z) > 6) continue;
            lo = Math.min(lo, solver.pos[o]);
            hi = Math.max(hi, solver.pos[o]);
        }
    }
    return hi > lo ? hi - lo : 0;
}

describe('webbing tension reaches the airframe', () => {

    it('retards an aircraft that flies into it', () => {
        const centred = run(0);
        assert.equal(centred.engaged, true, 'the net never caught it');
        assert.ok(centred.alongDeckLost > 20,
            `only ${centred.alongDeckLost.toFixed(1)} m/s came off in the net`);
    });

    it('drags an off-centre engagement back toward the centreline', () => {
        // Twice walked back for want of evidence, and now it holds: caught seven
        // metres to starboard, the airframe is pulled several metres inboard.
        //
        // It took fixing the wires to get here. While they could not propagate a
        // load they held nothing, the panel ends were dragged along with the
        // aircraft, and there was no geometry left to pull it anywhere — the
        // resultant came out inboard or outboard about equally, at a couple of
        // centimetres either way. With the cable actually tethering the panel to
        // its masts, the short side of the net does what it looks like it should.
        const off = run(7);
        const centred = run(0);
        assert.equal(off.engaged, true, 'the net never caught it');
        assert.ok(Math.abs(off.lateralTravel) > Math.abs(centred.lateralTravel) + 0.5,
            `off-centre moved ${off.lateralTravel.toFixed(2)} m against`
            + ` ${centred.lateralTravel.toFixed(2)} m centred — no sideways load at all`);
    });

    it('leaves a centred engagement running straight', () => {
        const centred = run(0);
        assert.ok(Math.abs(centred.lateralTravel) < 1.0,
            `a centred trap wandered ${centred.lateralTravel.toFixed(2)} m sideways`);
        assert.ok(Math.abs(centred.yaw) < 0.15,
            `a centred trap slewed ${(centred.yaw * 180 / Math.PI).toFixed(1)}°`);
    });

    it('slews an off-centre engagement more than a centred one', () => {
        const centred = run(0);
        const off = run(7);
        assert.ok(Math.abs(off.yaw) > Math.abs(centred.yaw),
            `off-centre slewed ${(off.yaw * 180 / Math.PI).toFixed(1)}° against`
            + ` ${(centred.yaw * 180 / Math.PI).toFixed(1)}° centred`);
    });

    it('is mirror-symmetric: port and starboard behave the same way', {
        todo: 'Fails since the Coulomb clamp was un-inverted and the webbing '
            + 'started actually gripping. Two thirds of that is now gone: giving '
            + 'contacts the surface velocity instead of push-depth over the '
            + 'substep took the residual from 10.8 m to 3.7 m, and port and '
            + 'starboard are at least equal and opposite now rather than one side '
            + 'not moving at all. The remaining bias still wants finding.',
    }, () => {
        // Nothing in the rig favours a side, so neither should the load. A sign
        // error in the carrier-local to world hop would show up exactly here.
        const port = run(-7);
        const stbd = run(7);
        // Loose, because sub-metre lateral travel is the noise floor here — see
        // the note on the off-centre test above. What this rules out is a rig
        // with a real handedness in it: a sign error in the carrier-local hop,
        // or a fitting placed half a station off centre, both of which showed up
        // as metres of difference rather than tenths.
        assert.ok(Math.abs(port.lateralTravel + stbd.lateralTravel) < 1.5,
            `port ${port.lateralTravel.toFixed(2)} m against starboard`
            + ` ${stbd.lateralTravel.toFixed(2)} m — the rig is lopsided`);
    });

    it('keeps the panel spread wide enough to hold a wing', {
        todo: 'The whole point of the net, and it does not do it yet. At first '
            + 'contact the panel is its full 30.5 m across the aircraft with all '
            + '24 stripes over it and six draped on the wings — the picture from '
            + 'the reference photographs. A third of a second later it has '
            + 'purse-strung shut to 9.5 m, and by the time the aircraft stops it '
            + 'is a 4.9 m bundle around the fuselage with the 11 m wing span '
            + 'entirely outside it: 34 of 47 contacts are on the fuselage and two '
            + 'lone stripes are on a wing. Nothing holds the panel out. The belts '
            + 'are inextensible with their ends on wires that pay out, so the '
            + 'moment the fuselage drives into the middle both ends are drawn '
            + 'inboard. Measured over run-outs of 60, 45, 35 and 25 m it is always '
            + 'the same two stripes, so it is not the run-out length.',
    }, () => {
        const centred = run(0);
        assert.ok(centred.panelWidthAtAircraft > WING_SPAN_M,
            `the webbing spans ${centred.panelWidthAtAircraft.toFixed(1)} m where the`
            + ` aircraft is, against a ${WING_SPAN_M} m wing span — the wings are outside the net`);
    });

    it('does not double-count the run-out it is not responsible for', () => {
        // The along-deck load belongs to the arresting engine. If the webbing's
        // own along-deck component were added on top, the aircraft would stop
        // short of the run-out the trap is tuned around.
        const centred = run(0, 600);
        assert.ok(centred.alongDeckLost > 55,
            `the run-out shed only ${centred.alongDeckLost.toFixed(1)} m/s of the 60 it entered with`);
    });
});
