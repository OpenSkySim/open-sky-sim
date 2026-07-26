import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as THREE from 'three';
import { PlayerEntity } from '../../scene/entities/player';
import { WeaponsTarget } from '../../scene/entities/weaponsTarget';
import { FORWARD, UP } from '../../utils/math';
import { CockpitFrontCameraUpdater } from './cockpitFrontCameraUpdater';

function mockActor(overrides: Partial<{
    position: THREE.Vector3;
    quaternion: THREE.Quaternion;
    cockpitOffset: THREE.Vector3;
    weaponsTarget: WeaponsTarget | undefined;
}> = {}): PlayerEntity & { setWeaponsTarget: (t: WeaponsTarget | undefined) => void } {
    const position = overrides.position?.clone() ?? new THREE.Vector3(0, 100, 0);
    const quaternion = overrides.quaternion?.clone() ?? new THREE.Quaternion();
    const cockpitOffset = overrides.cockpitOffset?.clone() ?? new THREE.Vector3(0, 1, 8);
    let weaponsTarget = overrides.weaponsTarget;

    return {
        getCockpitOffset: (out: THREE.Vector3) => out.copy(cockpitOffset),
        getDisplayPosition: () => position,
        getDisplayQuaternion: () => quaternion,
        getDisplayWorldDirection: (v: THREE.Vector3) => v.copy(FORWARD).applyQuaternion(quaternion),
        getDisplayWorldUp: (v: THREE.Vector3) => v.copy(UP).applyQuaternion(quaternion),
        getDisplayWorldRight: (v: THREE.Vector3) => v.set(1, 0, 0).applyQuaternion(quaternion),
        get weaponsTarget() {
            return weaponsTarget;
        },
        setWeaponsTarget(t: WeaponsTarget | undefined) {
            weaponsTarget = t;
        },
    } as unknown as PlayerEntity & { setWeaponsTarget: (t: WeaponsTarget | undefined) => void };
}

function makeTarget(position: THREE.Vector3): WeaponsTarget {
    return {
        position,
        localCenter: new THREE.Vector3(),
        maxSize: 15,
        targetType: 'BANDIT',
        targetLocation: 'AIR',
        airborne: true,
    };
}

describe('CockpitFrontCameraUpdater padlock', () => {
    it('looks along the aircraft nose when padlock is off', () => {
        const camera = new THREE.PerspectiveCamera(50, 1.6, 1, 40000);
        const actor = mockActor();
        const updater = new CockpitFrontCameraUpdater(actor, camera);
        updater.update(0);

        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        assert.ok(forward.dot(FORWARD) > 0.99);
    });

    it('looks at the weapons target when padlock is on', () => {
        const camera = new THREE.PerspectiveCamera(50, 1.6, 1, 40000);
        const actor = mockActor();
        const targetPos = new THREE.Vector3(0, 200, 500);
        actor.setWeaponsTarget(makeTarget(targetPos));

        const updater = new CockpitFrontCameraUpdater(actor, camera);
        updater.setPadlock(true);
        updater.update(0);

        const toTarget = targetPos.clone().sub(camera.position).normalize();
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        assert.ok(forward.dot(toTarget) > 0.99);
    });

    it('places the airframe HUD below a high padlocked target', () => {
        const camera = new THREE.PerspectiveCamera(50, 1.6, 1, 40000);
        const actor = mockActor();
        // Target high above and ahead — padlock looks up; nose projects lower.
        const targetPos = new THREE.Vector3(0, 400, 300);
        actor.setWeaponsTarget(makeTarget(targetPos));

        const updater = new CockpitFrontCameraUpdater(actor, camera);
        updater.setPadlock(true);
        updater.update(0);
        camera.updateMatrixWorld(true);

        const halfH = 100;
        const nose = camera.position.clone().addScaledVector(FORWARD, 100);
        nose.project(camera);
        const noseY = Math.round(-(nose.y * halfH) + halfH);

        const tgt = targetPos.clone().project(camera);
        const tgtY = Math.round(-(tgt.y * halfH) + halfH);

        // Screen Y grows downward: target near centre, nose (HUD) below it.
        assert.ok(Math.abs(tgtY - halfH) < 4, `expected target near centre, got ${tgtY}`);
        assert.ok(noseY > tgtY, `expected nose Y ${noseY} below target Y ${tgtY}`);
        assert.ok(noseY > halfH, `expected nose below screen centre, got ${noseY}`);
    });
});
