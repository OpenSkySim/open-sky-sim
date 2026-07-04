import { UnitSystems } from '../../../state/gameDefs';
import { toFeet, toKnots } from './overlayUtils';

const MPS_TO_KMH = 3.6;

export class DisplayUnits {

    private system: UnitSystems;

    constructor(system: UnitSystems = UnitSystems.METRIC) {
        this.system = system;
    }

    setSystem(system: UnitSystems) {
        this.system = system;
    }

    getSystem(): UnitSystems {
        return this.system;
    }

    altitudeFromMeters(meters: number): number {
        return this.system === UnitSystems.METRIC ? meters : toFeet(meters);
    }

    speedFromMps(metersPerSecond: number): number {
        return this.system === UnitSystems.METRIC
            ? metersPerSecond * MPS_TO_KMH
            : toKnots(metersPerSecond);
    }

    verticalSpeedFromMps(metersPerSecond: number): number {
        if (this.system === UnitSystems.METRIC) {
            return metersPerSecond;
        }
        return toFeet(metersPerSecond) * 60.0;
    }

    get altitudeStep(): number {
        return this.system === UnitSystems.METRIC ? 10 : 5;
    }

    get altitudeLowThreshold(): number {
        return 1000;
    }

    get useBarometricAltitude(): boolean {
        return this.system === UnitSystems.IMPERIAL;
    }

    get altitudeTapeLabelInterval(): number {
        return this.system === UnitSystems.METRIC ? 100 : 100;
    }

    get airspeedStep(): number {
        return 2.5;
    }

    get airspeedScale(): number {
        return 10;
    }

    get verticalSpeedBarDivisor(): number {
        return this.system === UnitSystems.METRIC ? 15 : 500;
    }

    formatAltitudeReadout(altitude: number): string {
        if (this.system === UnitSystems.METRIC) {
            return (Math.floor(altitude / 10) * 10).toFixed(0);
        }
        const step = this.altitudeStep;
        return (step * Math.round(altitude / step)).toFixed(0);
    }

    formatAltitudeTape(n: number, lowp: boolean): string {
        if (this.system === UnitSystems.METRIC) {
            return (Math.floor(n / 10) * 10).toFixed(0);
        }

        if (n < this.altitudeLowThreshold) {
            const num = lowp ? 900 + n / 10 : n;
            return num.toFixed(0);
        }

        const num = !lowp && n > this.altitudeLowThreshold ? (n - 900) * 10 : n;
        return `${(num / 1000).toFixed(0)}K`;
    }

    getAltitudeTickWidth(current: number, markerScale: number): number {
        if (this.system === UnitSystems.METRIC) {
            if (current % 100 === 0) {
                return 2;
            }
            if (current % 50 === 0) {
                return 1;
            }
            if (current % 10 === 0) {
                return 1;
            }
            return 0;
        }

        if (current % (100 * markerScale) === 0) {
            return 2;
        }
        if (current % (50 * markerScale) === 0) {
            return 1;
        }
        return 0;
    }

    altitudeUnitLabel(): string {
        return this.system === UnitSystems.METRIC ? 'M' : 'FT';
    }

    speedUnitLabel(): string {
        return this.system === UnitSystems.METRIC ? 'KMH' : 'KT';
    }
}
