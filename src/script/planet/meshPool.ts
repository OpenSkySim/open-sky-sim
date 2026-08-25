/** Pool of mesh-build workers with cancellation. */

import { CoastPolygon } from './coastVector';
import { FlattenPadSpec } from './flattenPad';
import { EnuBasis } from './geodesy';
import { MeshBuildRequest, MeshBuildResult, buildEllipsoidTileMesh, buildTileMesh } from './meshBuilder';
import { TileKey, tileKeyString } from './tiling';
import type { WorkerRequest, WorkerResponse } from './tileMeshWorker';

export interface MeshJobInput {
    id: TileKey;
    heights: Float32Array | null;
    size: number;
    geometricErrorM: number;
    maxErrorM: number;
    seaLevel: number;
    basis: EnuBasis;
    pad?: FlattenPadSpec;
    padHeightMsl?: number;
    landMask?: Uint8Array;
    /** OSM coastline polygons for this tile (cuts a vector-accurate shoreline). */
    polygons?: CoastPolygon[];
}

type JobResolve = (result: MeshBuildResult | null) => void;

interface PendingJob {
    key: string;
    input: MeshJobInput;
    resolve: JobResolve;
    cancelled: boolean;
}

export class MeshPool {
    private readonly workers: Worker[] = [];
    private readonly busy = new Set<Worker>();
    private readonly queue: PendingJob[] = [];
    private readonly byKey = new Map<string, PendingJob>();
    private jobId = 1;
    private readonly inflight = new Map<number, PendingJob>();
    private useWorkers: boolean;

    constructor(poolSize?: number) {
        const hw = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2;
        const n = Math.max(1, Math.min(4, poolSize ?? (hw - 1)));
        this.useWorkers = typeof Worker !== 'undefined';
        if (!this.useWorkers) {
            return;
        }
        try {
            for (let i = 0; i < n; i++) {
                const w = new Worker(new URL('./tileMeshWorker.ts', import.meta.url));
                w.onmessage = (ev: MessageEvent<WorkerResponse>) => this.onResult(w, ev.data);
                w.onerror = () => {
                    this.busy.delete(w);
                    this.pump();
                };
                this.workers.push(w);
            }
        } catch {
            this.useWorkers = false;
            this.workers.length = 0;
        }
    }

    /** Enqueue a build. Resolves to null if cancelled before completion. */
    request(input: MeshJobInput): Promise<MeshBuildResult | null> {
        const key = tileKeyString(input.id);
        const existing = this.byKey.get(key);
        if (existing && !existing.cancelled) {
            return new Promise(resolve => {
                const prev = existing.resolve;
                existing.resolve = result => {
                    prev(result);
                    resolve(result);
                };
            });
        }
        return new Promise<MeshBuildResult | null>(resolve => {
            const job: PendingJob = { key, input, resolve, cancelled: false };
            this.byKey.set(key, job);
            this.queue.push(job);
            this.pump();
        });
    }

    cancel(id: TileKey): void {
        const key = tileKeyString(id);
        const job = this.byKey.get(key);
        if (job) {
            job.cancelled = true;
        }
    }

    dispose(): void {
        for (const w of this.workers) {
            w.terminate();
        }
        this.workers.length = 0;
        for (const job of this.queue) {
            job.resolve(null);
        }
        this.queue.length = 0;
        this.byKey.clear();
    }

    get pending(): number {
        return this.queue.length + this.inflight.size;
    }

    private pump(): void {
        if (!this.useWorkers || this.workers.length === 0) {
            while (this.queue.length > 0) {
                const job = this.queue.shift()!;
                this.byKey.delete(job.key);
                if (job.cancelled) {
                    job.resolve(null);
                    continue;
                }
                try {
                    job.resolve(this.buildSync(job.input));
                } catch {
                    job.resolve(null);
                }
            }
            return;
        }
        for (const w of this.workers) {
            if (this.busy.has(w)) {
                continue;
            }
            const job = this.takeNext();
            if (!job) {
                return;
            }
            if (job.input.heights === null) {
                // Ellipsoid stub — trivial, do on main thread.
                this.byKey.delete(job.key);
                job.resolve(buildEllipsoidTileMesh(job.input.id, job.input.basis, job.input.seaLevel));
                continue;
            }
            const id = this.jobId++;
            this.inflight.set(id, job);
            this.busy.add(w);
            const req = toRequest(job.input);
            const msg: WorkerRequest = { jobId: id, req };
            const transfer: ArrayBuffer[] = [req.heights.buffer as ArrayBuffer];
            w.postMessage(msg, transfer);
        }
    }

    private takeNext(): PendingJob | undefined {
        while (this.queue.length > 0) {
            const job = this.queue.shift()!;
            if (job.cancelled) {
                this.byKey.delete(job.key);
                job.resolve(null);
                continue;
            }
            return job;
        }
        return undefined;
    }

    private onResult(worker: Worker, msg: WorkerResponse): void {
        this.busy.delete(worker);
        const job = this.inflight.get(msg.jobId);
        this.inflight.delete(msg.jobId);
        if (job) {
            this.byKey.delete(job.key);
            if (job.cancelled || !msg.result) {
                job.resolve(null);
            } else {
                job.resolve(msg.result);
            }
        }
        this.pump();
    }

    private buildSync(input: MeshJobInput): MeshBuildResult {
        if (input.heights === null) {
            return buildEllipsoidTileMesh(input.id, input.basis, input.seaLevel);
        }
        return buildTileMesh(toRequest(input));
    }
}

function toRequest(input: MeshJobInput): MeshBuildRequest {
    return {
        id: input.id,
        heights: input.heights!,
        size: input.size,
        geometricErrorM: input.geometricErrorM,
        maxErrorM: input.maxErrorM,
        seaLevel: input.seaLevel,
        basis: {
            origin: { ...input.basis.origin },
            lat0: input.basis.lat0,
            lon0: input.basis.lon0,
            ecefToEnu: input.basis.ecefToEnu.slice(),
            enuToEcef: input.basis.enuToEcef.slice(),
        },
        pad: input.pad,
        padHeightMsl: input.padHeightMsl,
        landMask: input.landMask,
        polygons: input.polygons,
    };
}
