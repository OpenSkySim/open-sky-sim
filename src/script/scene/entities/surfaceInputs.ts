import { clamp } from '../../utils/math';
import type { ControlAxis } from './aircraftDef';

/** Flap travel of a flaperon at full flaps (rad of its hinge range units). */
const FLAPS_EXTENDED_ANGLE = Math.PI / 5;
/**
 * Visible roll-deflection gains (fraction of a surface's hinge range at full
 * roll). Roll is tail-dominant (~80% differential stabilator / ~20% aileron),
 * so the stabilator shows the large, clearly visible roll deflection and the
 * flaperon only its small aileron share. Visual only — the physics split lives
 * in the FM2 config (taileronRollFraction / aileron max deflection).
 */
const ROLL_VIS_TAILERON = 0.6;
const ROLL_VIS_AILERON = 0.15;
/** Slats begin deploying above this absolute AoA (rad). */
const SLAT_AOA_ONSET_RAD = 10 * Math.PI / 180;
/** Slats reach full extension at this absolute AoA (rad). */
const SLAT_AOA_FULL_RAD = 18 * Math.PI / 180;

/**
 * Everything an aircraft's moving surfaces are posed from, in one place so a
 * replay can record it and pose them again exactly as they were.
 */
export interface SurfaceInputs {
    /** FCS-commanded elevator, stick polarity. */
    pitch: number;
    /** Roll deflection shown on the model (+right). */
    roll: number;
    /** FCS-commanded rudder. */
    yaw: number;
    /** 0..1 */
    flaps: number;
    /** 0..1 */
    slats: number;
    /** 0..1 */
    airbrake: number;
    /** 0..1 */
    sweep: number;
    /** 0..1, linear (eased when shown). */
    fold: number;
}

/** Floats per {@link SurfaceInputs} in a packed record. */
export const SURFACE_INPUT_FLOATS = 8;

export function newSurfaceInputs(): SurfaceInputs {
    return { pitch: 0, roll: 0, yaw: 0, flaps: 0, slats: 0, airbrake: 0, sweep: 0, fold: 0 };
}

/** Leading-edge slat extension: with the flaps, or by itself at high angle of attack. */
export function slatDeployment(flaps: number, angleOfAttack: number): number {
    const aoa = Math.abs(angleOfAttack);
    const aoaDeploy = aoa <= SLAT_AOA_ONSET_RAD
        ? 0
        : clamp((aoa - SLAT_AOA_ONSET_RAD) / (SLAT_AOA_FULL_RAD - SLAT_AOA_ONSET_RAD), 0, 1);
    return Math.max(flaps, aoaDeploy);
}

/** A surface's normalized deflection for its control binding. */
export function surfaceValue(inp: SurfaceInputs, control: ControlAxis, sign: number): number {
    const { pitch, roll, flaps } = inp;
    switch (control) {
        case 'pitch': return sign * pitch;
        case 'roll': return sign * roll;
        case 'yaw': return sign * inp.yaw;
        case 'flaps': return sign * flaps;
        case 'slats': return sign * inp.slats;
        case 'airbrake': return sign * inp.airbrake;
        case 'sweep': return sign * inp.sweep;
        // Smoothstep so the panels ease off and settle like hydraulics.
        case 'fold': return sign * inp.fold * inp.fold * (3 - 2 * inp.fold);
        // Flaperons: flap camber blended with the ailerons' SHARE of the roll.
        // Roll is tail-dominant (~20% aileron), so the flaperon shows only a
        // small roll deflection.
        case 'flaperonLeft':
            return flaps * -FLAPS_EXTENDED_ANGLE - (1.0 - flaps * 0.5) * ROLL_VIS_AILERON * roll;
        case 'flaperonRight':
            return flaps * FLAPS_EXTENDED_ANGLE - (1.0 - flaps * 0.5) * ROLL_VIS_AILERON * roll;
        // All-moving stabilator: pitch plus the DOMINANT differential
        // (taileron) roll deflection, so the tail-driven roll is clearly
        // visible. Left/right take opposite roll signs; a right roll raises
        // the right stabilator trailing edge (same sense as the right aileron).
        case 'stabilatorLeft':
            return sign * (pitch - ROLL_VIS_TAILERON * roll);
        case 'stabilatorRight':
            return sign * (pitch + ROLL_VIS_TAILERON * roll);
        default: return 0;
    }
}

export function writeSurfaceInputs(inp: SurfaceInputs, out: Float32Array | Float64Array, o: number): void {
    out[o] = inp.pitch; out[o + 1] = inp.roll; out[o + 2] = inp.yaw; out[o + 3] = inp.flaps;
    out[o + 4] = inp.slats; out[o + 5] = inp.airbrake; out[o + 6] = inp.sweep; out[o + 7] = inp.fold;
}

/** Blend `k` (0..1) of the way from the record at `d0[a]` to the one at `d1[b]`. */
export function readSurfaceInputs(
    d0: Float32Array | Float64Array, a: number,
    d1: Float32Array | Float64Array, b: number,
    k: number, out: SurfaceInputs,
): void {
    const f = (i: number) => d0[a + i] + (d1[b + i] - d0[a + i]) * k;
    out.pitch = f(0); out.roll = f(1); out.yaw = f(2); out.flaps = f(3);
    out.slats = f(4); out.airbrake = f(5); out.sweep = f(6); out.fold = f(7);
}

export function copySurfaceInputs(from: SurfaceInputs, to: SurfaceInputs): SurfaceInputs {
    Object.assign(to, from);
    return to;
}
