import { EnuBasis, ecefToEnu, geodeticToEcef } from './geo';
import { HeightSource } from './heightSource';

/** ENU-axis-aligned flatten pad (metres). */
export interface FlattenPadSpec {
    centerX: number;
    centerZ: number;
    halfW: number;
    halfD: number;
    featherM: number;
}

/**
 * Wraps a height source and forces a constant MSL height inside an ENU AABB,
 * with a soft feather at the rim so the pad edge is not a cliff.
 */
export class FlattenPadHeightSource implements HeightSource {
    private padHeightMsl: number | undefined;
    private spec: FlattenPadSpec;

    constructor(
        private readonly inner: HeightSource,
        private readonly basis: EnuBasis,
        spec: FlattenPadSpec,
    ) {
        this.spec = { ...spec };
    }

    /** Update pad footprint (inactive until {@link setPadHeightMsl}). */
    configure(spec: FlattenPadSpec): void {
        this.spec = { ...spec };
    }

    /** Lock pad height (MSL metres). Call after DEM tiles covering the centre are loaded. */
    setPadHeightMsl(heightMsl: number): void {
        this.padHeightMsl = heightMsl;
    }

    get isActive(): boolean {
        return this.padHeightMsl !== undefined && Number.isFinite(this.padHeightMsl);
    }

    heightAt(lon: number, lat: number): number {
        const raw = this.inner.heightAt(lon, lat);
        if (!this.isActive) {
            return raw;
        }
        const padH = this.padHeightMsl!;
        const ecef = geodeticToEcef(lat, lon, Number.isFinite(raw) ? raw : padH);
        const enu = ecefToEnu(this.basis, ecef);
        const t = padBlendWeight(enu.e, enu.n, this.spec);
        if (t <= 0) {
            return raw;
        }
        const base = Number.isFinite(raw) ? raw : padH;
        return base + (padH - base) * t;
    }

    maxZoomAt(lon: number, lat: number): number {
        return this.inner.maxZoomAt(lon, lat);
    }

    coversTile(id: Parameters<HeightSource['coversTile']>[0]): boolean {
        return this.inner.coversTile(id);
    }
}

/** 1 = full pad, 0 = outside (including feather falloff). */
export function padBlendWeight(e: number, n: number, spec: FlattenPadSpec): number {
    const feather = Math.max(1, spec.featherM);
    const coreW = Math.max(0, spec.halfW - feather);
    const coreD = Math.max(0, spec.halfD - feather);
    const dx = Math.abs(e - spec.centerX);
    const dz = Math.abs(n - spec.centerZ);
    if (dx >= spec.halfW || dz >= spec.halfD) {
        return 0;
    }
    if (dx <= coreW && dz <= coreD) {
        return 1;
    }
    const tx = dx <= coreW ? 1 : 1 - (dx - coreW) / feather;
    const tz = dz <= coreD ? 1 : 1 - (dz - coreD) / feather;
    const t = Math.max(0, Math.min(1, Math.min(tx, tz)));
    // Smoothstep for a softer rim.
    return t * t * (3 - 2 * t);
}
