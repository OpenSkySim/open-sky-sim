import { EnuBasis, ecefToEnu, enuToGeodeticApprox, geodeticToEcef } from './geo';
import { HeightSource } from './heightSource';

/**
 * CPU height sampling for physics / AI in local ENU world metres
 * (+X east, +Y up, +Z north).
 *
 * Returns the ENU up-component of the DEM surface (not raw MSL), so it stays
 * correct even when the sample is tens of km from the ENU origin.
 */
export class HeightSampler {
    constructor(
        private readonly source: HeightSource,
        private readonly basis: EnuBasis,
        private readonly seaLevel: number = 0,
    ) { }

    heightAtLonLat(lon: number, lat: number): number {
        return this.source.heightAt(lon, lat);
    }

    /** Ground Y in ENU/world metres at horizontal (x, z). */
    heightAtEnu(x: number, z: number): number {
        const g = enuToGeodeticApprox(this.basis, x, z, 0);
        let h = this.source.heightAt(g.lon, g.lat);
        if (!Number.isFinite(h)) {
            h = this.seaLevel;
        }
        const ecef = geodeticToEcef(g.lat, g.lon, h);
        return ecefToEnu(this.basis, ecef).u;
    }

    isLandEnu(x: number, z: number, seaThreshold: number = 0.5): boolean {
        const g = enuToGeodeticApprox(this.basis, x, z, 0);
        const h = this.source.heightAt(g.lon, g.lat);
        if (!Number.isFinite(h)) {
            return false;
        }
        // DSM zeros / near-sea samples are water, not beach.
        return h > seaThreshold;
    }
}
