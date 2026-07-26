import * as THREE from 'three';
import { PlayerEntity, AircraftDeviceState } from '../scene/entities/player';
import { PilotableAircraft } from './aircraftControls';

/**
 * Adapts the human {@link PlayerEntity} to the {@link PilotableAircraft} control
 * channel so the very same {@link import('./aiPilot').AiPilot} that flies an
 * opponent can also fly the player's plane (autopilot++). The player entity's
 * public setters/getters are simply forwarded here.
 */
export class PlayerPilotAdapter implements PilotableAircraft {

    constructor(private readonly player: PlayerEntity) { }

    setPitch(pitch: number): void { this.player.setPitch(pitch); }
    setRoll(roll: number): void { this.player.setRoll(roll); }
    setYaw(yaw: number): void { this.player.setYaw(yaw); }
    setThrottle(throttle: number): void { this.player.setThrottle(throttle); }
    setWheelBrakes(applied: boolean): void { this.player.setWheelBrakes(applied); }
    setLandingGearDeployed(deployed: boolean): void { this.player.setLandingGearDeployed(deployed); }
    setFlapsExtended(extended: boolean): void { this.player.setFlapsExtended(extended); }

    getPosition(): THREE.Vector3 { return this.player.position; }
    getVelocity(): THREE.Vector3 { return this.player.velocityVector; }
    getQuaternion(): THREE.Quaternion { return this.player.quaternion; }
    getAirspeed(): number { return this.player.rawSpeed; }
    getAltitude(): number { return this.player.position.y; }
    getAngleOfAttack(): number { return this.player.angleOfAttack; }
    getLoadFactorG(): number { return this.player.loadFactorG; }
    getStallStatus(): number { return this.player.stallStatus; }
    isLanded(): boolean { return this.player.isLanded; }
    isCrashed(): boolean { return this.player.isCrashed; }
    isGearDeployed(): boolean { return this.player.landingGear === AircraftDeviceState.EXTENDED; }
    isFlapsExtended(): boolean { return this.player.flaps === AircraftDeviceState.EXTENDED; }
}
