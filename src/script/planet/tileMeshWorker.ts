/**
 * Web Worker entry: build a tile mesh from a DEM height grid.
 * Bundled via `new Worker(new URL('./tileMeshWorker.ts', import.meta.url))`.
 */

import { buildTileMesh, MeshBuildRequest, MeshBuildResult } from './meshBuilder';

export interface WorkerRequest {
    jobId: number;
    req: MeshBuildRequest;
}

export interface WorkerResponse {
    jobId: number;
    result?: MeshBuildResult;
    error?: string;
}

self.onmessage = (ev: MessageEvent<WorkerRequest>) => {
    const { jobId, req } = ev.data;
    try {
        const result = buildTileMesh(req);
        const transfer: ArrayBuffer[] = [
            result.positions.buffer as ArrayBuffer,
            result.indices.buffer as ArrayBuffer,
            result.tones.buffer as ArrayBuffer,
            result.groups.buffer as ArrayBuffer,
        ];
        (self as unknown as Worker).postMessage(
            { jobId, result } satisfies WorkerResponse,
            transfer,
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        (self as unknown as Worker).postMessage(
            { jobId, error: message } satisfies WorkerResponse,
        );
    }
};
