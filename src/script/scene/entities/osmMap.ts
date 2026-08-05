import * as THREE from 'three';
import { Palette } from '../../config/palettes/palette';
import { CanvasPainter } from '../../render/screen/canvasPainter';
import { Entity } from '../entity';
import { Scene } from '../scene';
import { EnuBasis, ecefToEnu, enuToGeodeticApprox, geodeticToEcef } from '../../planet/geodesy';

const OSM_TILE_URL = '/api/osm/{z}/{x}/{y}';
const OSM_ZOOM = 12;
const MAX_TILES = 25;

/**
 * OpenStreetMap tiles for the cockpit MFD.
 * Painted in 2D (canvas) so COOP/COEP + custom WebGL materials cannot hide them.
 */
export class OsmMapEntity implements Entity {
    readonly tags: string[] = [];
    enabled = true;

    private readonly images = new Map<string, HTMLImageElement | 'loading' | 'error'>();
    private readonly basis: EnuBasis | undefined;
    private playerX = 0;
    private playerZ = 0;

    constructor(basis?: EnuBasis) {
        this.basis = basis;
    }

    init(_scene: Scene): void {
        //
    }

    update(_delta: number): void {
        //
    }

    /** Call each frame from the cockpit before painting MFD1. */
    setPlayerEnu(x: number, z: number): void {
        this.playerX = x;
        this.playerZ = z;
        if (this.basis) {
            this.ensureTiles(x, z, 10000);
        }
    }

    /**
     * Draw OSM into the MFD rectangle (pixel space). Returns true if any tile drew.
     */
    paint(painter: CanvasPainter, mfdX: number, mfdY: number, mfdSize: number): boolean {
        if (!this.basis) {
            return false;
        }
        const halfWorld = 10000;
        const sw = enuToGeodeticApprox(this.basis, this.playerX - halfWorld, this.playerZ - halfWorld, 0);
        const ne = enuToGeodeticApprox(this.basis, this.playerX + halfWorld, this.playerZ + halfWorld, 0);
        const z = OSM_ZOOM;
        const t0 = lonLatToTile(sw.lon, sw.lat, z);
        const t1 = lonLatToTile(ne.lon, ne.lat, z);
        const x0 = Math.min(t0.x, t1.x);
        const x1 = Math.max(t0.x, t1.x);
        const y0 = Math.min(t0.y, t1.y);
        const y1 = Math.max(t0.y, t1.y);

        let drew = false;
        let count = 0;
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                if (count++ >= MAX_TILES) {
                    break;
                }
                const key = `${z}/${tx}/${ty}`;
                const img = this.images.get(key);
                if (!img || img === 'loading' || img === 'error') {
                    continue;
                }
                const b = tileBoundsLonLat(z, tx, ty);
                const swE = this.lonLatToEnu(b.west, b.south);
                const neE = this.lonLatToEnu(b.east, b.north);
                // Map ENU → MFD pixels (north up, east right): world relative to player
                const xL = mfdX + ((swE.e - (this.playerX - halfWorld)) / (halfWorld * 2)) * mfdSize;
                const xR = mfdX + ((neE.e - (this.playerX - halfWorld)) / (halfWorld * 2)) * mfdSize;
                const yT = mfdY + ((this.playerZ + halfWorld - neE.n) / (halfWorld * 2)) * mfdSize;
                const yB = mfdY + ((this.playerZ + halfWorld - swE.n) / (halfWorld * 2)) * mfdSize;
                const dw = Math.max(1, xR - xL);
                const dh = Math.max(1, yB - yT);
                painter.drawImage(img, xL, yT, dw, dh);
                drew = true;
            }
        }
        return drew;
    }

    render3D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        _lists: Map<string, THREE.Scene>,
        _palette: Palette,
    ): void {
        // Canvas path only.
    }

    render2D(
        _targetWidth: number,
        _targetHeight: number,
        _camera: THREE.Camera,
        _lists: Set<string>,
        _painter: CanvasPainter,
        _palette: Palette,
    ): void {
        //
    }

    private ensureTiles(camX: number, camZ: number, halfWorld: number): void {
        const sw = enuToGeodeticApprox(this.basis!, camX - halfWorld, camZ - halfWorld, 0);
        const ne = enuToGeodeticApprox(this.basis!, camX + halfWorld, camZ + halfWorld, 0);
        const z = OSM_ZOOM;
        const t0 = lonLatToTile(sw.lon, sw.lat, z);
        const t1 = lonLatToTile(ne.lon, ne.lat, z);
        const x0 = Math.min(t0.x, t1.x);
        const x1 = Math.max(t0.x, t1.x);
        const y0 = Math.min(t0.y, t1.y);
        const y1 = Math.max(t0.y, t1.y);
        let count = 0;
        for (let ty = y0; ty <= y1; ty++) {
            for (let tx = x0; tx <= x1; tx++) {
                if (count++ >= MAX_TILES) {
                    return;
                }
                this.requestTile(z, tx, ty);
            }
        }
    }

    private requestTile(z: number, x: number, y: number): void {
        const key = `${z}/${x}/${y}`;
        if (this.images.has(key)) {
            return;
        }
        this.images.set(key, 'loading');
        const url = OSM_TILE_URL.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { this.images.set(key, img); };
        img.onerror = () => { this.images.set(key, 'error'); };
        img.src = url;
    }

    private lonLatToEnu(lon: number, lat: number): { e: number; n: number } {
        const ecef = geodeticToEcef(lat, lon, 0);
        const enu = ecefToEnu(this.basis!, ecef);
        return { e: enu.e, n: enu.n };
    }
}

export function lonLatToTile(lon: number, lat: number, z: number): { x: number; y: number } {
    const n = 2 ** z;
    const x = Math.floor(((lon + 180) / 360) * n);
    const latRad = lat * Math.PI / 180;
    const y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
    return {
        x: Math.max(0, Math.min(n - 1, x)),
        y: Math.max(0, Math.min(n - 1, y)),
    };
}

export function tileBoundsLonLat(z: number, x: number, y: number): {
    west: number; south: number; east: number; north: number;
} {
    const n = 2 ** z;
    const west = x / n * 360 - 180;
    const east = (x + 1) / n * 360 - 180;
    const north = tileYToLat(y, n);
    const south = tileYToLat(y + 1, n);
    return { west, south, east, north };
}

function tileYToLat(y: number, n: number): number {
    const t = Math.PI * (1 - 2 * y / n);
    return Math.atan(Math.sinh(t)) * 180 / Math.PI;
}
