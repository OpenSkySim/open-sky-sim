import * as THREE from 'three';
import { computeMachNumber } from './aeroUtils';

const RAD2DEG = 180 / Math.PI;

/**
 * A single frame of the pilot's commands, the resulting rigid-body state, and a
 * handful of derived aerodynamic quantities. Everything the LLM needs to reason
 * about (and later tune) the flight model is captured here.
 */
export interface FlightSample {
    // Pilot commands
    pitchCmd: number;   // [-1, 1] aft-positive stick
    rollCmd: number;    // [-1, 1] right-positive stick
    yawCmd: number;     // [-1, 1] right-positive pedal
    thrLever: number;   // [0, 1] throttle quadrant lever
    gear: boolean;
    flaps: boolean;
    brake: boolean;
    // FCS-commanded surface deflections (post-actuator lag, [-1, 1])
    stabilizer: number; // +nose-up
    aileron: number;    // +right roll
    rudder: number;     // +right pedal
    // Engine
    effThr: number;     // [0, 1] spooled/effective throttle
    thrustKn: number;
    // Rigid-body state (world frame; X-right, Y-up, Z-forward)
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    quaternion: THREE.Quaternion;
    // Telemetry from the model
    aoaRad: number;
    loadG: number;
    stall: number;      // >= 0 means stalling
    landed: boolean;
    crashed: boolean;
}

// Columns emitted to the recording file, in order.
const FIELDS = [
    't', 'dt',
    'pitchCmd', 'rollCmd', 'yawCmd', 'thrLever', 'gear', 'flaps', 'brake',
    'stabilizer', 'aileron', 'rudder',
    'effThr', 'thrustKn',
    'px', 'py', 'pz',
    'vx', 'vy', 'vz',
    'qx', 'qy', 'qz', 'qw',
    'tasMs', 'altM', 'vsMs', 'mach',
    'aoaDeg', 'loadG',
    'headingDeg', 'pitchDeg', 'rollDeg',
    'rollRateDeg', 'pitchRateDeg', 'yawRateDeg',
    'stall', 'landed', 'crashed',
] as const;

function round(value: number, decimals: number): number {
    const f = 10 ** decimals;
    return Math.round(value * f) / f;
}

/**
 * Records a flight as a time series of pilot inputs and aircraft response so the
 * recording can later be fed to an LLM to analyse and tune the flight model.
 *
 * Toggle it in-game; on stop it downloads a JSON file with a compact columnar
 * layout ({ fields, rows }) plus metadata.
 */
export class FlightRecorder {
    private recording = false;
    private modelName = '';
    private startedAtMs = 0;
    private rows: number[][] = [];

    private readonly euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private readonly prevQuat = new THREE.Quaternion();
    private readonly relQuat = new THREE.Quaternion();
    private readonly rateAxis = new THREE.Vector3();
    private hasPrev = false;

    private indicator: HTMLDivElement | null = null;

    isRecording(): boolean {
        return this.recording;
    }

    /** Starts a fresh recording for the given flight model name. */
    start(modelName: string): void {
        this.recording = true;
        this.modelName = modelName;
        this.startedAtMs = Date.now();
        this.rows = [];
        this.hasPrev = false;
        this.showIndicator();
    }

    /** Stops recording and, if any samples were captured, downloads the file. */
    stop(): void {
        if (!this.recording) return;
        this.recording = false;
        this.hideIndicator();
        if (this.rows.length > 0) {
            this.download();
        }
    }

    toggle(modelName: string): void {
        if (this.recording) {
            this.stop();
        } else {
            this.start(modelName);
        }
    }

    /** Appends one frame. `delta` is the frame time in seconds. */
    record(sample: FlightSample, delta: number): void {
        if (!this.recording || delta <= 0) return;

        const t = (Date.now() - this.startedAtMs) / 1000;
        const vel = sample.velocity;
        const tas = vel.length();

        this.euler.setFromQuaternion(sample.quaternion);
        const headingDeg = this.euler.y * RAD2DEG;
        const pitchDeg = this.euler.x * RAD2DEG;
        const rollDeg = this.euler.z * RAD2DEG;

        // Body angular rates from the frame-to-frame orientation change.
        let rollRate = 0, pitchRate = 0, yawRate = 0;
        if (this.hasPrev) {
            this.relQuat.copy(this.prevQuat).invert().multiply(sample.quaternion);
            const w = Math.min(1, Math.max(-1, this.relQuat.w));
            const angle = 2 * Math.acos(w);
            const s = Math.sqrt(1 - w * w);
            if (s > 1e-6 && angle > 1e-6) {
                this.rateAxis.set(this.relQuat.x, this.relQuat.y, this.relQuat.z).multiplyScalar(1 / s);
                const rate = angle / delta;
                pitchRate = this.rateAxis.x * rate * RAD2DEG;
                yawRate = this.rateAxis.y * rate * RAD2DEG;
                rollRate = this.rateAxis.z * rate * RAD2DEG;
            }
        }
        this.prevQuat.copy(sample.quaternion);
        this.hasPrev = true;

        this.rows.push([
            round(t, 3), round(delta, 4),
            round(sample.pitchCmd, 3), round(sample.rollCmd, 3), round(sample.yawCmd, 3), round(sample.thrLever, 3),
            sample.gear ? 1 : 0, sample.flaps ? 1 : 0, sample.brake ? 1 : 0,
            round(sample.stabilizer, 3), round(sample.aileron, 3), round(sample.rudder, 3),
            round(sample.effThr, 3), round(sample.thrustKn, 2),
            round(sample.position.x, 2), round(sample.position.y, 2), round(sample.position.z, 2),
            round(vel.x, 3), round(vel.y, 3), round(vel.z, 3),
            round(sample.quaternion.x, 5), round(sample.quaternion.y, 5), round(sample.quaternion.z, 5), round(sample.quaternion.w, 5),
            round(tas, 2), round(sample.position.y, 2), round(vel.y, 3), round(computeMachNumber(tas, sample.position.y), 3),
            round(sample.aoaRad * RAD2DEG, 2), round(sample.loadG, 3),
            round(headingDeg, 2), round(pitchDeg, 2), round(rollDeg, 2),
            round(rollRate, 2), round(pitchRate, 2), round(yawRate, 2),
            round(sample.stall, 3), sample.landed ? 1 : 0, sample.crashed ? 1 : 0,
        ]);

        this.updateIndicator(t);
    }

    private download(): void {
        const durationSec = this.rows.length > 0 ? this.rows[this.rows.length - 1][0] : 0;
        const payload = {
            meta: {
                schema: 'retroflightsim.flight-recording/1',
                model: this.modelName,
                recordedAt: new Date(this.startedAtMs).toISOString(),
                durationSec,
                sampleCount: this.rows.length,
                axes: 'world frame: X-right, Y-up, Z-forward; body rates roll=Z pitch=X yaw=Y',
                units: {
                    t: 's', dt: 's', position: 'm', velocity: 'm/s', tasMs: 'm/s',
                    altM: 'm', vsMs: 'm/s', angles: 'deg', rates: 'deg/s', thrustKn: 'kN',
                },
                fieldDocs: {
                    pitchCmd: 'aft-positive stick [-1,1]', rollCmd: 'right-positive stick [-1,1]',
                    yawCmd: 'right-positive pedal [-1,1]', thrLever: 'throttle lever [0,1]',
                    stabilizer: 'FCS-commanded stabilator deflection, +nose-up [-1,1]',
                    aileron: 'FCS-commanded aileron deflection, +right roll [-1,1]',
                    rudder: 'FCS-commanded rudder deflection, +right pedal [-1,1]',
                    effThr: 'spooled engine throttle [0,1]', stall: '>=0 means stalling',
                },
            },
            fields: FIELDS,
            rows: this.rows,
        };

        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flight-${this.modelName}-${this.fileTimestamp()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private fileTimestamp(): string {
        const d = new Date(this.startedAtMs);
        const p = (n: number) => `${n}`.padStart(2, '0');
        return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    }

    private showIndicator(): void {
        if (this.indicator) return;
        const el = document.createElement('div');
        el.textContent = '\u25CF REC';
        el.style.cssText = [
            'position:fixed', 'top:8px', 'left:50%', 'transform:translateX(-50%)',
            'z-index:9999', 'font-family:monospace', 'font-size:13px', 'font-weight:bold',
            'color:#ff3030', 'background:rgba(0,0,0,0.45)', 'padding:2px 8px',
            'border:1px solid #ff3030', 'border-radius:3px', 'pointer-events:none',
        ].join(';');
        document.body.appendChild(el);
        this.indicator = el;
    }

    private updateIndicator(t: number): void {
        if (!this.indicator) return;
        this.indicator.textContent = `\u25CF REC ${t.toFixed(0)}s (${this.rows.length})`;
    }

    private hideIndicator(): void {
        if (this.indicator) {
            this.indicator.remove();
            this.indicator = null;
        }
    }
}
