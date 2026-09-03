/**
 * F7: the mission editor.
 *
 * A modal plan view over the running game, in the shape `AreaPicker` set: the
 * markup lives in index.html, the constructor finds it by id and throws if it
 * is missing, and `show()`/`hide()` toggle one class. The sim is paused while
 * it is open, but the scene keeps rendering behind it, so closing the panel
 * puts you straight back where you were.
 *
 * Drawing splits three ways: `MissionMapRaster` paints the terrain,
 * `mapProjection` decides where everything is, and this owns the pointer, the
 * overlays and the DOM. `MissionEdit` holds the document; nothing here mutates
 * a mission directly, so undo cannot be bypassed.
 */

import { SceneRunway, airfieldChoices } from '../state/activeAirfield';
import { Airfield } from '../terrain/airfields';
import { EnuBasis, geodeticToWorld, worldToGeodetic } from '../terrain/geodesy';
import { HeightField } from '../terrain/heightField';
import {
    MISSION_MAX_ENEMY, MISSION_MAX_FRIENDLY, MISSION_AI_MODELS, MISSION_LEG_ACTIONS,
    MISSION_SKILLS, MissionDoc, MissionFaction, MissionLegAction, MissionPoint,
} from '../mission/missionFormat';
import { MissionEdit, emptyMission } from '../mission/missionEdit';
import { MissionStore, MissionSummary } from '../mission/missionStore';
import { MissionIssue, missionSlug, validateMission } from '../mission/missionValidate';
import {
    MapView, fitTo, nearestLegSegment, nearestPlaced, panBy, screenToWorld,
    worldToScreen, zoomAbout,
} from '../mission/mapProjection';
import { MissionMapRaster } from './missionMap';
import { MissionCoverRaster } from './missionCover';
import { FacetPalette, toneColour } from '../mission/facetColour';
import { TerrainTone } from '../terrain/tones';
import { PtmTile } from '../terrain/ptm';
import { TileKey, tileRangeForBounds } from '../terrain/tiling';
import { TileStore } from '../terrain/tileStore';

/** What a click on the map does. */
type PointerMode = 'waypoint' | 'spawn' | 'player';

export interface MissionEditorDeps {
    heights: HeightField;
    basis: EnuBasis;
    seaLevel: number;
    queryZoom: number;
    coarseZoom: number;
    /** Runways of the active area, already filtered — see the note in show(). */
    sceneRunways: readonly SceneRunway[];
    /**
     * The same airfields with their taxiways, aprons and buildings, so the plan
     * view can draw the field rather than a stroke through the middle of it.
     * Already filtered to this area — the file holds every airfield in the
     * pyramid, and drawing another area's would put Berlin over Gran Canaria.
     */
    airfields(): readonly Airfield[];
    /** Name of the active play area, for a new mission's `area`. */
    areaName: string;
    /** Scene Y of the ground, for the elevation readout. */
    groundHeightAt(x: number, z: number): number;
    /**
     * The mesh tiles in memory, and how the sim would colour them. Together
     * these are what make the chart the same picture as the world: the
     * coastline comes from the mesh's baked OSM water rather than from a height
     * threshold, and the land takes its real landcover and satellite colour.
     */
    meshTiles(): Array<{ id: TileKey; tile: PtmTile }>;
    facetPalette(): FacetPalette;
    /**
     * A mesh cache belonging to the editor, so it can pull in tiles for ground
     * the aircraft has never been over without evicting the renderer's.
     */
    createMeshStore(maxBytes: number): TileStore<PtmTile>;
    meshZoomRange(): { min: number; max: number };
    /** Fly the mission currently in the editor. */
    onFly(doc: MissionDoc): void;
    onClose(): void;
}

function mustGet<T extends HTMLElement>(id: string): T {
    const el = document.getElementById(id);
    if (el === null) {
        // Duplicated from AreaPicker rather than shared: the project has three
        // competing idioms for this and no agreed home for a fourth.
        throw new Error(`Mission editor: missing #${id}`);
    }
    return el as T;
}

/**
 * Sampling for the first pass: one sample per 4x4 block. Cheap enough to run on
 * every pan frame at any canvas size, and the refinement pass replaces it.
 */
const COARSE_STEP = 4;
/** Rows of full-resolution raster per slice of the refinement pass. */
const REFINE_BAND_ROWS = 24;
/** How long a refinement slice may hold the main thread, in ms. */
const REFINE_BUDGET_MS = 8;

/**
 * Most fine tiles the editor will pull in for one view.
 *
 * A fine tile is ~9.8 km across and ~264 KB decoded, against a 64 MB height
 * budget shared with the renderer, so this is what stops a zoomed-out view from
 * asking for a continent. Above the cap the coarse tier answers, which is the
 * right trade anyway: once one pixel covers more ground than the gap between
 * fine samples, the extra detail is invisible.
 */
const MAX_DETAIL_TILES = 64;

/**
 * Most mesh tiles the editor will hold for the chart.
 *
 * These live in the editor's own cache, not the renderer's, so the ceiling is
 * about the editor's own footprint rather than about evicting terrain from
 * under the aircraft. A mesh tile is a few hundred KB.
 */
const MAX_MESH_TILES = 96;
/** Byte budget for that cache. Released with the store when the panel is done. */
const MESH_CACHE_BYTES = 48 * 1024 * 1024;
/** Quiet time after the view moves before detail is requested, in ms. */
const DETAIL_SETTLE_MS = 220;

/**
 * Zoom thresholds for airfield detail, in metres per pixel.
 *
 * Pavement appears once a 45 m runway is more than a couple of pixels wide;
 * buildings once a hangar is more than a dot. Drawn any earlier they are noise
 * that hides the terrain, and the centreline says everything the scale can
 * carry anyway.
 */
const AIRFIELD_PAVEMENT_MPERPX = 40;
const AIRFIELD_BUILDING_MPERPX = 12;

/** Airfield surfaces, in the chart's register rather than the sim's. */
const RUNWAY_PAVED = '#d8d8d4';
const RUNWAY_UNPAVED = '#b6b49a';
const TAXIWAY_STROKE = '#b9b9b4';
const APRON_FILL = '#a9a9a4';
const BUILDING_FILL: Record<string, string> = {
    terminal: '#f0e3c8',
    hangar: '#e0d6c4',
    tower: '#ffd9a0',
};

/**
 * One airfield with every point already in scene metres.
 *
 * Projected once when the panel opens rather than per draw: a busy field is
 * thousands of taxiway points, each of which would otherwise take a geodetic to
 * ECEF to ENU conversion on every frame — and the refinement pass redraws many
 * times a second. Screen position from here is a scale and a translate.
 */
interface ProjectedAirfield {
    /** Flat x,z pairs. */
    aprons: Float64Array[];
    taxiways: Array<{ widthM: number; pts: Float64Array }>;
    runways: Array<{
        ax: number; az: number; bx: number; bz: number;
        widthM: number; paved: boolean;
    }>;
    buildings: Array<{
        x: number; z: number; heading: number;
        widthM: number; depthM: number; kind: string;
    }>;
}

/** Colours for each flight's route, cycled by index. */
const ROUTE_COLOURS = ['#7fd0ff', '#ffd27f', '#a6ff7f', '#ff9ecf', '#c7a6ff', '#7fffe0'];

export class MissionEditorPanel {

    private readonly panel = mustGet('mission-editor');
    private readonly canvas = mustGet<HTMLCanvasElement>('mission-map');
    private readonly ctx: CanvasRenderingContext2D;
    private readonly listEl = mustGet<HTMLSelectElement>('mission-list');
    private readonly flightsEl = mustGet<HTMLSelectElement>('mission-flights');
    private readonly routesEl = mustGet<HTMLSelectElement>('mission-routes');
    private readonly propsEl = mustGet('mission-props');
    private readonly errorsEl = mustGet('mission-errors');
    private readonly readoutEl = mustGet('mission-readout');
    private readonly statusEl = mustGet('mission-status');
    private readonly countsEl = mustGet('mission-counts');
    private readonly modeLabelEl = mustGet('mission-mode-label');
    private readonly nameEl = mustGet<HTMLInputElement>('mission-name');
    private readonly playerFieldEl = mustGet<HTMLSelectElement>('mission-player-field');
    private readonly playerAirborneEl = mustGet<HTMLInputElement>('mission-player-airborne');
    private readonly saveBtn = mustGet<HTMLButtonElement>('mission-save');
    private readonly flyBtn = mustGet<HTMLButtonElement>('mission-fly');
    private readonly deleteBtn = mustGet<HTMLButtonElement>('mission-delete');
    private readonly importInput = mustGet<HTMLInputElement>('mission-import');

    private readonly store = new MissionStore();
    private readonly raster: MissionMapRaster;
    private readonly cover = new MissionCoverRaster();
    private edit: MissionEdit;
    private view: MapView = { centreX: 0, centreZ: 0, mPerPx: 120, widthPx: 800, heightPx: 520 };
    private mode: PointerMode = 'waypoint';
    private open = false;

    /** Drag state: which handle is being moved, if any. */
    private dragLeg: { routeId: string; legId: string } | undefined;
    private dragSpawn: string | undefined;
    private panFrom: { x: number; y: number } | undefined;
    /** In-flight full-resolution pass; see {@link scheduleRefine}. */
    private refineHandle: number | undefined;
    private refineGeneration = 0;
    /** Debounce + generation for {@link requestDetail}. */
    private detailTimer: number | undefined;
    private detailGeneration = 0;
    /**
     * The editor's own mesh cache — see `TerrainEntity.createMeshStore`. Built
     * on first open, because a session that never presses F7 should not pay for
     * it.
     */
    private meshStore: TileStore<PtmTile> | undefined;
    private meshGeneration = 0;
    /** Airfield geometry in scene metres; see {@link ProjectedAirfield}. */
    private projectedAirfields: ProjectedAirfield[] = [];
    private summaries: MissionSummary[] = [];
    private issues: { errors: MissionIssue[]; warnings: MissionIssue[] } =
        { errors: [], warnings: [] };

    constructor(private readonly deps: MissionEditorDeps) {
        const ctx = this.canvas.getContext('2d');
        if (ctx === null) {
            throw new Error('Mission editor: no 2D context');
        }
        this.ctx = ctx;
        this.raster = new MissionMapRaster({
            heights: deps.heights,
            basis: deps.basis,
            seaLevel: deps.seaLevel,
            queryZoom: deps.queryZoom,
            coarseZoom: deps.coarseZoom,
        });
        this.edit = new MissionEdit(emptyMission('new-mission', 'New mission', deps.areaName));
        this.wire();
    }

    get isOpen(): boolean {
        return this.open;
    }

    async show(): Promise<void> {
        this.open = true;
        this.panel.classList.remove('hidden');
        // Terrain streams in after boot, and the panel may have been built
        // before it landed. Cheap — it re-reads a map of already-decoded tiles.
        this.raster.refresh();
        const facets = this.deps.facetPalette();
        this.cover.setTiles(this.allMeshTiles(), this.deps.basis, facets);
        const water = toneColour(TerrainTone.Water, facets.toneColours);
        this.raster.setSeaColour(water.r * 255, water.g * 255, water.b * 255);
        this.projectAirfields();
        this.resize();
        this.fit();
        await this.refreshList();
        // Resolved here rather than in the render path: the label has to say
        // what the button will actually do, and refreshAll() cannot await.
        this.storeIsLocal = !await this.store.hasServer();
        this.saveBtn.title = await this.store.saveBlockedBecause() ?? '';
        this.refreshAll();
    }

    hide(): void {
        this.cancelRefine();
        if (this.detailTimer !== undefined) {
            clearTimeout(this.detailTimer);
            this.detailTimer = undefined;
        }
        this.open = false;
        this.panel.classList.add('hidden');
    }

    // --- wiring -----------------------------------------------------------

    private wire(): void {
        new ResizeObserver(() => {
            if (this.open) {
                this.resize();
                this.draw();
            }
        }).observe(this.canvas);

        this.canvas.addEventListener('pointerdown', e => this.onDown(e));
        this.canvas.addEventListener('pointermove', e => this.onMove(e));
        this.canvas.addEventListener('pointerup', e => this.onUp(e));
        this.canvas.addEventListener('pointerleave', () => { this.panFrom = undefined; });
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('wheel', e => this.onWheel(e), { passive: false });

        // Ctrl+Z / Ctrl+Y while the panel has focus. Bound on the panel rather
        // than the document so it cannot fire while the game has the keyboard.
        this.panel.addEventListener('keydown', e => {
            if (!e.ctrlKey && !e.metaKey) {
                return;
            }
            if (e.key === 'z') { this.edit.undo(); this.refreshAll(); e.preventDefault(); }
            if (e.key === 'y') { this.edit.redo(); this.refreshAll(); e.preventDefault(); }
        });

        mustGet('mission-mode-waypoint').addEventListener('click', () => this.setMode('waypoint'));
        mustGet('mission-mode-spawn').addEventListener('click', () => this.setMode('spawn'));
        mustGet('mission-mode-player').addEventListener('click', () => this.setMode('player'));
        mustGet('mission-fit').addEventListener('click', () => { this.fit(); this.draw(); });

        mustGet('mission-new').addEventListener('click', () => this.newMission());
        mustGet('mission-load').addEventListener('click', () => void this.loadSelected());
        this.deleteBtn.addEventListener('click', () => void this.deleteSelected());
        this.saveBtn.addEventListener('click', () => void this.save());
        this.flyBtn.addEventListener('click', () => this.fly());
        mustGet('mission-close').addEventListener('click', () => this.requestClose());
        mustGet('mission-import-btn').addEventListener('click', () => this.importInput.click());
        this.importInput.addEventListener('change', () => void this.onImport());

        mustGet('mission-flight-add').addEventListener('click', () => this.addFlight());
        mustGet('mission-flight-dup').addEventListener('click', () => {
            const id = this.flightsEl.value;
            if (id) { this.edit.duplicateFlight(id); this.refreshAll(); }
        });
        mustGet('mission-flight-del').addEventListener('click', () => {
            const id = this.flightsEl.value;
            if (id) { this.edit.removeFlight(id); this.refreshAll(); }
        });
        this.flightsEl.addEventListener('change', () => {
            this.edit.selection = { kind: 'flight', flightId: this.flightsEl.value };
            this.refreshAll();
        });

        mustGet('mission-route-add').addEventListener('click', () => {
            this.edit.addRoute(); this.refreshAll();
        });
        mustGet('mission-route-del').addEventListener('click', () => {
            const id = this.routesEl.value;
            if (id) { this.edit.removeRoute(id); this.refreshAll(); }
        });
        this.routesEl.addEventListener('change', () => this.refreshAll());

        this.nameEl.addEventListener('change', () => {
            this.edit.setName(this.nameEl.value);
            this.refreshAll();
        });
        this.playerFieldEl.addEventListener('change', () => {
            this.edit.setPlayerStart({ airfield: this.playerFieldEl.value || undefined });
            this.refreshAll();
        });
        this.playerAirborneEl.addEventListener('change', () => {
            this.edit.setPlayerStart({ airborne: this.playerAirborneEl.checked });
            this.refreshAll();
        });
    }

    private setMode(mode: PointerMode): void {
        this.mode = mode;
        this.refreshAll();
    }

    private requestClose(): void {
        if (this.edit.isDirty
            && !window.confirm('This mission has unsaved changes. Close anyway?')) {
            return;
        }
        this.deps.onClose();
    }

    // --- geometry ---------------------------------------------------------

    private resize(): void {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));
        this.canvas.width = Math.round(w * dpr);
        this.canvas.height = Math.round(h * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.view = { ...this.view, widthPx: w, heightPx: h };
    }

    private pointer(e: PointerEvent | WheelEvent): { x: number; y: number } {
        const r = this.canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    private toPoint(sx: number, sy: number, altitudeM = 4000): MissionPoint {
        const w = screenToWorld(this.view, sx, sy);
        const g = worldToGeodetic(this.deps.basis, w.x, 0, w.z);
        return { lat: g.lat, lon: g.lon, altitudeM, agl: true };
    }

    private legWorld(p: MissionPoint): { x: number; z: number } {
        const v = geodeticToWorld(this.deps.basis, p.lat, p.lon, 0);
        return { x: v.x, z: v.z };
    }

    /** Fit to the mission if it has anything placed, else to the baked terrain. */
    private fit(): void {
        const placed: Array<{ x: number; z: number }> = [];
        for (const r of this.edit.doc.routes) {
            for (const l of r.legs) placed.push(this.legWorld(l.at));
        }
        for (const f of this.edit.doc.flights) placed.push(this.legWorld(f.start.position));
        for (const r of this.deps.sceneRunways) placed.push({ x: r.center.x, z: r.center.z });
        this.view = fitTo(this.view, placed.length > 0 ? placed : this.raster.coarseExtent());
    }

    // --- input ------------------------------------------------------------

    private selectedRouteId(): string | undefined {
        return this.routesEl.value || this.edit.doc.routes[0]?.id;
    }

    private onDown(e: PointerEvent): void {
        const p = this.pointer(e);
        this.canvas.setPointerCapture(e.pointerId);

        if (this.mode === 'player') {
            this.edit.setPlayerStart({ position: this.toPoint(p.x, p.y, 0) });
            this.refreshAll();
            return;
        }

        // A spawn marker under the cursor outranks everything: it is the only
        // thing you can be holding in spawn mode.
        const flights = this.edit.doc.flights;
        const spawnHit = nearestPlaced(
            this.view, flights.map(f => this.legWorld(f.start.position)), p.x, p.y, 10);
        if (spawnHit !== undefined) {
            if (e.button === 2) {
                this.edit.removeFlight(flights[spawnHit].id);
                this.refreshAll();
                return;
            }
            this.dragSpawn = flights[spawnHit].id;
            this.edit.selection = { kind: 'flight', flightId: this.dragSpawn };
            this.refreshAll();
            return;
        }

        if (this.mode === 'spawn') {
            this.addFlightAt(this.toPoint(p.x, p.y, 4000));
            return;
        }

        // The first fix of a mission has nowhere to go yet. Making the author
        // find "Routes → Add" before the primary interaction does anything —
        // and silently panning until they do — is a puzzle, not a workflow.
        let route = this.edit.route(this.selectedRouteId());
        if (route === undefined) {
            if (e.button === 2) {
                this.panFrom = p;
                return;
            }
            const created = this.edit.addRoute();
            this.refreshAll();
            this.routesEl.value = created;
            route = this.edit.route(created);
        }
        if (route === undefined) {
            this.panFrom = p;
            return;
        }
        const world = route.legs.map(l => this.legWorld(l.at));

        const legHit = nearestPlaced(this.view, world, p.x, p.y, 10);
        if (legHit !== undefined) {
            if (e.button === 2) {
                this.edit.deleteLeg(route.id, route.legs[legHit].id);
                this.refreshAll();
                return;
            }
            this.dragLeg = { routeId: route.id, legId: route.legs[legHit].id };
            this.edit.selection = { kind: 'leg', routeId: route.id, legId: this.dragLeg.legId };
            this.refreshAll();
            return;
        }
        if (e.button === 2) {
            this.panFrom = p;
            return;
        }

        // On a leg line: insert there rather than appending at the end, which
        // is what makes a route correctable in the middle.
        const seg = nearestLegSegment(this.view, world, p.x, p.y, 8, route.loop);
        if (seg !== undefined) {
            const id = this.edit.insertLeg(route.id, seg, this.toPoint(p.x, p.y));
            if (id !== undefined) {
                this.edit.selection = { kind: 'leg', routeId: route.id, legId: id };
            }
            this.refreshAll();
            return;
        }

        const id = this.edit.addLeg(route.id, this.toPoint(p.x, p.y));
        if (id !== undefined) {
            this.edit.selection = { kind: 'leg', routeId: route.id, legId: id };
        }
        this.refreshAll();
    }

    private onMove(e: PointerEvent): void {
        const p = this.pointer(e);
        const w = screenToWorld(this.view, p.x, p.y);
        const g = worldToGeodetic(this.deps.basis, w.x, 0, w.z);
        const elev = this.raster.heightAt(w.x, w.z);
        const tier = this.raster.tierAt(w.x, w.z);
        // The tier is shown, not hidden: off the fine tier the elevation is an
        // interpolation across a 611 m lattice, and an author placing a low fix
        // needs to know that before the AI flies into what it did not see.
        this.readoutEl.textContent =
            `${g.lat.toFixed(4)}, ${g.lon.toFixed(4)}  `
            + `elev ${Number.isFinite(elev) ? `${Math.round(elev)} m` : '—'} (${tier})`;

        if (this.dragLeg !== undefined) {
            const pt = this.toPoint(p.x, p.y);
            this.edit.moveLeg(this.dragLeg.routeId, this.dragLeg.legId, pt.lat, pt.lon);
            this.draw();
            return;
        }
        if (this.dragSpawn !== undefined) {
            this.edit.setFlightStart(this.dragSpawn, this.toPoint(p.x, p.y, 4000));
            this.draw();
            return;
        }
        if (this.panFrom !== undefined) {
            this.view = panBy(this.view, p.x - this.panFrom.x, p.y - this.panFrom.y);
            this.panFrom = p;
            this.draw();
        }
    }

    private onUp(e: PointerEvent): void {
        this.canvas.releasePointerCapture(e.pointerId);
        const wasDragging = this.dragLeg !== undefined || this.dragSpawn !== undefined;
        this.dragLeg = undefined;
        this.dragSpawn = undefined;
        this.panFrom = undefined;
        if (wasDragging) {
            this.refreshAll();
        }
    }

    private onWheel(e: WheelEvent): void {
        e.preventDefault();
        const p = this.pointer(e);
        this.view = zoomAbout(this.view, p.x, p.y, e.deltaY > 0 ? 1.2 : 1 / 1.2);
        this.draw();
    }

    // --- document actions -------------------------------------------------

    private addFlight(): void {
        const centre = this.toPoint(this.view.widthPx / 2, this.view.heightPx / 2, 4000);
        this.addFlightAt(centre);
    }

    private addFlightAt(at: MissionPoint): void {
        const faction: MissionFaction =
            this.edit.doc.flights.some(f => f.faction === 'enemy') ? 'player' : 'enemy';
        const id = this.edit.addFlight(faction, at, 0);
        this.edit.selection = { kind: 'flight', flightId: id };
        this.refreshAll();
    }

    private newMission(): void {
        if (this.edit.isDirty
            && !window.confirm('This mission has unsaved changes. Discard them?')) {
            return;
        }
        this.edit.reset(emptyMission('new-mission', 'New mission', this.deps.areaName));
        this.fit();
        this.refreshAll();
    }

    private async loadSelected(): Promise<void> {
        const id = this.listEl.value;
        if (!id) {
            return;
        }
        if (this.edit.isDirty
            && !window.confirm('This mission has unsaved changes. Discard them?')) {
            return;
        }
        const res = await this.store.load(id);
        if (res.doc === undefined) {
            this.issues = { errors: res.errors ?? [{ path: '', message: res.error ?? 'load failed' }], warnings: [] };
            this.refreshAll();
            return;
        }
        this.edit.reset(res.doc);
        this.fit();
        this.setStatus(res.doc.area === this.deps.areaName
            ? `loaded ${res.doc.name}`
            : `loaded ${res.doc.name} — authored in area "${res.doc.area}"`);
        this.refreshAll();
    }

    private async deleteSelected(): Promise<void> {
        const id = this.listEl.value;
        if (!id || !window.confirm(`Delete mission "${id}"?`)) {
            return;
        }
        const res = await this.store.remove(id);
        this.setStatus(res.ok ? `deleted ${id}` : `delete failed: ${res.error}`);
        await this.refreshList();
        this.refreshAll();
    }

    private async save(): Promise<void> {
        // The id is the filename; derive it from the name so an author never
        // has to think about slugs, but keep an existing id stable.
        const doc = this.edit.doc;
        const id = missionSlug(doc.id) === doc.id && doc.id !== 'new-mission'
            ? doc.id
            : missionSlug(doc.name);
        if (!id) {
            this.setStatus('give the mission a name with letters or digits first');
            return;
        }
        const toSave: MissionDoc = { ...doc, id };
        const res = await this.store.save(toSave);
        if (!res.ok) {
            this.issues = {
                errors: res.errors ?? [{ path: '', message: res.error ?? 'save failed' }],
                warnings: this.issues.warnings,
            };
            this.setStatus('save failed');
            this.refreshAll();
            return;
        }
        this.edit.reset({ ...toSave, savedUtc: res.savedUtc });
        this.edit.markSaved(res.savedUtc);
        this.setStatus(res.downloaded ? `downloaded ${id}.mission.json` : `saved ${id}`);
        await this.refreshList();
        this.refreshAll();
    }

    private async onImport(): Promise<void> {
        const file = this.importInput.files?.[0];
        this.importInput.value = '';
        if (file === undefined) {
            return;
        }
        const res = await this.store.importFile(file);
        if (res.doc === undefined) {
            this.issues = {
                errors: res.errors ?? [{ path: '', message: res.error ?? 'import failed' }],
                warnings: [],
            };
            this.setStatus('import failed');
            this.refreshAll();
            return;
        }
        this.edit.reset(res.doc);
        this.fit();
        this.setStatus(`imported ${res.doc.name}`);
        this.refreshAll();
    }

    private fly(): void {
        const v = validateMission(this.edit.doc);
        if (!v.ok || v.doc === undefined) {
            this.issues = { errors: v.errors, warnings: v.warnings };
            this.setStatus('mission has problems');
            this.refreshAll();
            return;
        }
        this.deps.onFly(v.doc);
    }

    private setStatus(text: string): void {
        this.statusEl.textContent = text;
    }

    // --- rendering --------------------------------------------------------

    private async refreshList(): Promise<void> {
        this.summaries = await this.store.list();
        this.listEl.innerHTML = '';
        for (const s of this.summaries) {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = s.area === this.deps.areaName
                ? s.name
                : `${s.name} (${s.area})`;
            this.listEl.append(opt);
        }
        const hasServer = await this.store.hasServer();
        this.deleteBtn.disabled = !hasServer;
        this.deleteBtn.title = hasServer ? '' : 'needs the dev server (npm start)';
    }

    /** Everything that depends on the document. */
    private refreshAll(): void {
        const doc = this.edit.doc;
        const v = validateMission(doc);
        this.issues = { errors: v.errors, warnings: v.warnings };

        this.nameEl.value = doc.name;
        this.playerAirborneEl.checked = doc.player.airborne;
        this.refreshAirfields();
        this.refreshFlights();
        this.refreshRoutes();
        this.refreshProps();
        this.refreshIssues();
        this.refreshCounts();
        this.refreshModes();

        this.flyBtn.disabled = !v.ok;
        this.flyBtn.title = v.ok
            ? ''
            : `fix ${v.errors.length} problem${v.errors.length === 1 ? '' : 's'} first`;
        this.saveBtn.textContent = this.storeIsLocal ? 'Download' : 'Save';
        this.draw();
    }

    /**
     * True when there is no dev server, so Save writes a file instead. Cached
     * in show() because the label is set from the synchronous render path.
     */
    private storeIsLocal = false;

    private refreshAirfields(): void {
        const want = this.edit.doc.player.airfield ?? '';
        if (this.playerFieldEl.options.length === 0) {
            const none = document.createElement('option');
            none.value = '';
            none.textContent = '(pick an airfield)';
            this.playerFieldEl.append(none);
            for (const a of airfieldChoices(this.deps.sceneRunways)) {
                const opt = document.createElement('option');
                // The key airfieldChoices emits, which findRunwayByKey resolves.
                opt.value = a.icao || a.name;
                opt.textContent = a.icao ? `${a.icao} — ${a.name}` : a.name;
                this.playerFieldEl.append(opt);
            }
        }
        this.playerFieldEl.value = want;
    }

    private refreshFlights(): void {
        const keep = this.flightsEl.value;
        this.flightsEl.innerHTML = '';
        for (const f of this.edit.doc.flights) {
            const opt = document.createElement('option');
            opt.value = f.id;
            const route = f.routeId ? ` → ${f.routeId}` : '';
            opt.textContent = `${f.faction === 'enemy' ? 'R' : 'B'} ${f.name ?? f.id} ×${f.count}${route}`;
            this.flightsEl.append(opt);
        }
        const sel = this.edit.selection;
        this.flightsEl.value = sel.kind === 'flight' ? sel.flightId : keep;
    }

    private refreshRoutes(): void {
        const keep = this.routesEl.value;
        this.routesEl.innerHTML = '';
        for (const r of this.edit.doc.routes) {
            const opt = document.createElement('option');
            opt.value = r.id;
            opt.textContent = `${r.name ?? r.id} (${r.legs.length}${r.loop ? ' ↻' : ''})`;
            this.routesEl.append(opt);
        }
        this.routesEl.value = keep || this.edit.doc.routes[0]?.id || '';
    }

    private refreshCounts(): void {
        const count = (f: MissionFaction) => this.edit.doc.flights
            .filter(x => x.faction === f).reduce((n, x) => n + x.count, 0);
        const enemy = count('enemy');
        const friendly = count('player');
        this.countsEl.textContent =
            `enemy ${enemy}/${MISSION_MAX_ENEMY}   friendly ${friendly}/${MISSION_MAX_FRIENDLY}`;
    }

    private refreshModes(): void {
        for (const [mode, id] of [
            ['waypoint', 'mission-mode-waypoint'],
            ['spawn', 'mission-mode-spawn'],
            ['player', 'mission-mode-player'],
        ] as const) {
            mustGet(id).classList.toggle('active', this.mode === mode);
        }
        this.modeLabelEl.textContent = {
            waypoint: 'click to add a fix · click a line to insert · drag to move · right-click to delete',
            spawn: 'click to place a flight start',
            player: 'click to place the player start',
        }[this.mode];
    }

    private field(label: string, control: HTMLElement): HTMLElement {
        const row = document.createElement('div');
        row.className = 'field';
        const l = document.createElement('label');
        l.textContent = label;
        row.append(l, control);
        return row;
    }

    private numberField(
        label: string, value: number | undefined, onChange: (v: number) => void,
        step = 1,
    ): HTMLElement {
        const input = document.createElement('input');
        input.type = 'number';
        input.step = String(step);
        input.value = value === undefined ? '' : String(value);
        input.addEventListener('change', () => {
            const n = Number(input.value);
            if (Number.isFinite(n)) {
                onChange(n);
                this.refreshAll();
            }
        });
        return this.field(label, input);
    }

    private selectField<T extends string>(
        label: string, options: readonly T[], value: T | undefined,
        onChange: (v: T) => void, blank?: string,
    ): HTMLElement {
        const sel = document.createElement('select');
        if (blank !== undefined) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = blank;
            sel.append(opt);
        }
        for (const o of options) {
            const opt = document.createElement('option');
            opt.value = o;
            opt.textContent = o;
            sel.append(opt);
        }
        sel.value = value ?? '';
        sel.addEventListener('change', () => { onChange(sel.value as T); this.refreshAll(); });
        return this.field(label, sel);
    }

    private refreshProps(): void {
        this.propsEl.innerHTML = '';
        const sel = this.edit.selection;

        if (sel.kind === 'leg') {
            const route = this.edit.route(sel.routeId);
            const leg = route?.legs.find(l => l.id === sel.legId);
            if (route === undefined || leg === undefined) {
                return;
            }
            const index = route.legs.indexOf(leg);
            const title = document.createElement('div');
            title.textContent = `Leg ${index + 1} of ${route.legs.length} — ${route.name ?? route.id}`;
            this.propsEl.append(title);
            this.propsEl.append(this.selectField<MissionLegAction>(
                'Action', MISSION_LEG_ACTIONS, leg.action,
                v => this.edit.setLegField(route.id, leg.id, 'action', v)));
            this.propsEl.append(this.numberField(
                leg.at.agl ? 'Alt AGL (m)' : 'Alt (m)', leg.at.altitudeM,
                v => this.edit.setLegAltitude(route.id, leg.id, v), 50));
            this.propsEl.append(this.numberField(
                'Speed (m/s)', leg.speedMps,
                v => this.edit.setLegField(route.id, leg.id, 'speedMps', v), 10));
            this.propsEl.append(this.numberField(
                'Capture (m)', leg.captureRadiusM,
                v => this.edit.setLegField(route.id, leg.id, 'captureRadiusM', v), 250));
            if (leg.action === 'orbit') {
                this.propsEl.append(this.numberField(
                    'Hold (s)', leg.holdSeconds,
                    v => this.edit.setLegField(route.id, leg.id, 'holdSeconds', v), 10));
            }
            if (leg.action === 'land') {
                this.propsEl.append(this.selectField(
                    'Airfield',
                    airfieldChoices(this.deps.sceneRunways).map(a => a.icao || a.name),
                    leg.airfield,
                    v => this.edit.setLegField(route.id, leg.id, 'airfield', v),
                    '(pick one)'));
            }
            const loop = document.createElement('input');
            loop.type = 'checkbox';
            loop.checked = route.loop;
            loop.addEventListener('change', () => {
                this.edit.setRouteLoop(route.id, loop.checked);
                this.refreshAll();
            });
            this.propsEl.append(this.field('Route loops', loop));
            return;
        }

        if (sel.kind === 'flight') {
            const flight = this.edit.flight(sel.flightId);
            if (flight === undefined) {
                return;
            }
            const name = document.createElement('input');
            name.type = 'text';
            name.value = flight.name ?? flight.id;
            name.addEventListener('change', () => {
                this.edit.setFlightField(flight.id, 'name', name.value);
                this.refreshAll();
            });
            this.propsEl.append(this.field('Name', name));
            this.propsEl.append(this.selectField<MissionFaction>(
                'Faction', ['enemy', 'player'], flight.faction,
                v => this.edit.setFlightField(flight.id, 'faction', v)));
            this.propsEl.append(this.numberField(
                'Count', flight.count,
                v => this.edit.setFlightField(flight.id, 'count', v)));
            this.propsEl.append(this.numberField(
                'Heading (true)', flight.start.headingDeg,
                v => this.edit.setFlightStart(flight.id, undefined, v), 5));
            this.propsEl.append(this.selectField(
                'Route', this.edit.doc.routes.map(r => r.id), flight.routeId,
                v => this.edit.assignRoute(flight.id, v || undefined), '(none — loiter)'));
            this.propsEl.append(this.selectField<MissionFaction>(
                'Engages', ['enemy', 'player'], flight.engages,
                v => this.edit.setFlightField(flight.id, 'engages', v || undefined),
                '(nothing)'));
            this.propsEl.append(this.selectField(
                'Skill', MISSION_SKILLS, flight.pilot?.skill,
                v => this.edit.setFlightPilot(flight.id, { skill: v }), '(default)'));
            this.propsEl.append(this.selectField(
                'AI model', MISSION_AI_MODELS, flight.pilot?.model,
                v => this.edit.setFlightPilot(flight.id, { model: v }), '(default)'));
            this.propsEl.append(this.numberField(
                'Cruise alt (m)', flight.pilot?.cruiseAltitudeM,
                v => this.edit.setFlightPilot(flight.id, { cruiseAltitudeM: v }), 250));
            this.propsEl.append(this.numberField(
                'Cruise spd (m/s)', flight.pilot?.cruiseSpeedMps,
                v => this.edit.setFlightPilot(flight.id, { cruiseSpeedMps: v }), 10));
            const airborne = document.createElement('input');
            airborne.type = 'checkbox';
            airborne.checked = flight.start.airborne;
            airborne.addEventListener('change', () => {
                this.edit.setFlightField(flight.id, 'start', {
                    ...flight.start,
                    airborne: airborne.checked,
                    onGround: !airborne.checked,
                });
                this.refreshAll();
            });
            this.propsEl.append(this.field('Airborne', airborne));
            return;
        }

        const hint = document.createElement('div');
        hint.textContent = 'Select a flight or a waypoint.';
        this.propsEl.append(hint);
    }

    private refreshIssues(): void {
        this.errorsEl.innerHTML = '';
        const rows: Array<{ issue: MissionIssue; warn: boolean }> = [
            ...this.issues.errors.map(issue => ({ issue, warn: false })),
            ...this.issues.warnings.map(issue => ({ issue, warn: true })),
        ];
        for (const { issue, warn } of rows) {
            const li = document.createElement('li');
            li.className = warn ? 'warn' : '';
            li.textContent = issue.path ? `${issue.path}: ${issue.message}` : issue.message;
            // Clicking an issue selects what it is about, which is the whole
            // point of carrying a path on it.
            li.addEventListener('click', () => this.selectByPath(issue.path));
            this.errorsEl.append(li);
        }
        if (rows.length === 0) {
            const li = document.createElement('li');
            li.className = 'warn';
            li.textContent = 'none';
            this.errorsEl.append(li);
        }
    }

    /** Jump the selection to whatever an issue path names. */
    private selectByPath(path: string): void {
        const route = /^routes\[(\d+)\]\.legs\[(\d+)\]/.exec(path);
        if (route !== null) {
            const r = this.edit.doc.routes[Number(route[1])];
            const leg = r?.legs[Number(route[2])];
            if (r !== undefined && leg !== undefined) {
                this.routesEl.value = r.id;
                this.edit.selection = { kind: 'leg', routeId: r.id, legId: leg.id };
                this.refreshAll();
            }
            return;
        }
        const flight = /^flights\[(\d+)\]/.exec(path);
        if (flight !== null) {
            const f = this.edit.doc.flights[Number(flight[1])];
            if (f !== undefined) {
                this.edit.selection = { kind: 'flight', flightId: f.id };
                this.refreshAll();
            }
        }
    }

    // --- the map ----------------------------------------------------------

    private draw(): void {
        const ctx = this.ctx;
        const { widthPx: w, heightPx: h } = this.view;

        if (this.raster.isEmpty) {
            ctx.fillStyle = '#101418';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#c8c8c8';
            ctx.font = '13px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('No baked terrain — run npm run bake:mesh', w / 2, h / 2);
            ctx.textAlign = 'left';
            return;
        }

        // Something on screen immediately, at every scale, whatever else is
        // happening: a quarter-resolution pass over a fullscreen canvas is a
        // few milliseconds.
        this.cancelRefine();
        this.raster.render(this.view, COARSE_STEP);
        // Rasterised once per view rather than per refinement slice: the
        // triangles do not change while the height layer is being refined.
        this.cover.render(this.view);
        this.blit();

        // Then walk it up to one sample per pixel, unless the pointer is still
        // moving — refining under a drag would only ever be thrown away.
        if (this.dragLeg === undefined && this.dragSpawn === undefined
            && this.panFrom === undefined) {
            this.scheduleRefine();
            this.scheduleDetail();
            void this.requestMesh();
        }
    }

    /**
     * Pull in the fine height tier for whatever is on screen.
     *
     * Without this the chart shows only what the *renderer* happened to load —
     * which is wherever the aircraft has been, and the coarse tier everywhere
     * else. The coarse tier is one sample every 611 m, so a coastline you have
     * not flown over comes out as a staircase, and a waypoint placed against it
     * is being placed against a guess.
     *
     * This does use the renderer's height store, which the map's read path
     * deliberately never touches. That is a considered trade rather than an
     * oversight: the sim is paused while the editor is open, so nothing is
     * flying over terrain that might get evicted, and the streamer refills
     * around the aircraft as soon as the panel closes. What it must not do is
     * ask for an unbounded amount, hence the tile cap.
     */
    private scheduleDetail(): void {
        if (this.detailTimer !== undefined) {
            clearTimeout(this.detailTimer);
        }
        // Debounced: a wheel zoom is a burst of view changes, and requesting on
        // each one would queue tiles for views already scrolled past.
        this.detailTimer = window.setTimeout(() => {
            this.detailTimer = undefined;
            void this.requestDetail();
        }, DETAIL_SETTLE_MS);
    }

    /**
     * Every mesh tile the chart may draw: the renderer's, plus the editor's own.
     *
     * Both, not either. The renderer holds fine tiles wherever the aircraft has
     * been, which is the best data available there; the editor's own store
     * covers everywhere else at whatever zoom the view can use. The cover raster
     * prefers the finer of two tiles over the same ground, so they compose.
     */
    private allMeshTiles(): Array<{ id: TileKey; tile: PtmTile }> {
        const mine = this.meshStore === undefined
            ? []
            : this.meshStore.peekAll().map(e => ({ id: e.id, tile: e.value }));
        return [...mine, ...this.deps.meshTiles()];
    }

    /**
     * Fetch mesh tiles covering the view, so the chart has the sim's coastline
     * and colours over ground nobody has flown.
     *
     * The zoom is chosen rather than fixed: the finest one whose tiles still fit
     * the budget for this view. Zoomed out that lands on a coarse level covering
     * the whole area in a handful of files; zoomed in it walks down toward the
     * mesh's own maximum. Anything the renderer already holds is finer still and
     * wins where it overlaps.
     */
    private async requestMesh(): Promise<void> {
        const view = this.view;
        const range = this.deps.meshZoomRange();
        if (this.meshStore === undefined) {
            this.meshStore = this.deps.createMeshStore(MESH_CACHE_BYTES);
        }
        const store = this.meshStore;

        // Geodetic bounds of the view, from its corners.
        const corners = [
            screenToWorld(view, 0, 0),
            screenToWorld(view, view.widthPx, 0),
            screenToWorld(view, 0, view.heightPx),
            screenToWorld(view, view.widthPx, view.heightPx),
        ].map(w => worldToGeodetic(this.deps.basis, w.x, 0, w.z));
        const bounds = {
            west: Math.min(...corners.map(g => g.lon)),
            east: Math.max(...corners.map(g => g.lon)),
            south: Math.min(...corners.map(g => g.lat)),
            north: Math.max(...corners.map(g => g.lat)),
        };

        // Walk from fine to coarse for the first zoom that both fits the
        // budget AND actually exists here.
        //
        // Existence is not a formality: the mesh pyramid is not uniformly deep,
        // and over some areas the finest level that fits the view has no tiles
        // at all. Stopping at the first zoom that merely *fits* left the chart
        // falling back on whatever ancestors happened to be cached — as coarse
        // as z0, which is a continent in a handful of triangles.
        let wanted: TileKey[] = [];
        for (let z = range.max; z >= range.min; z--) {
            const r = tileRangeForBounds(z, bounds);
            const count = (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
            if (count <= 0 || count > MAX_MESH_TILES) {
                continue;
            }
            const candidate: TileKey[] = [];
            for (let y = r.y0; y <= r.y1; y++) {
                for (let x = r.x0; x <= r.x1; x++) {
                    candidate.push({ z, x, y });
                }
            }
            if (candidate.every(id => store.isAbsent(id))) {
                continue;
            }
            wanted = candidate;
            break;
        }
        if (wanted.length === 0) {
            return;
        }
        // Nothing new to ask for is the common case once a view has settled.
        if (wanted.every(id => store.peek(id) !== undefined || store.isAbsent(id))) {
            return;
        }

        const generation = ++this.meshGeneration;
        // A tile that will not load is not worth failing the whole chart over:
        // most of a sea view is tiles the bake never wrote, and the store
        // already treats those as absent rather than as errors.
        await Promise.all(wanted.map(id => store.request(id, 1).catch(() => null)));
        if (generation !== this.meshGeneration || !this.open) {
            return;
        }
        this.cover.setTiles(this.allMeshTiles(), this.deps.basis, this.deps.facetPalette());
        this.draw();
    }

    private async requestDetail(): Promise<void> {
        const view = this.view;
        // Half the diagonal covers the corners of the view, not just its sides.
        const radiusM = Math.hypot(view.widthPx, view.heightPx) * view.mPerPx / 2;
        const wanted = this.deps.heights.fineTileIdsAroundWorld(
            view.centreX, view.centreZ, radiusM);
        if (wanted.length === 0 || wanted.length > MAX_DETAIL_TILES) {
            return;
        }
        // Nothing to do if every tile is already here — the common case when
        // nudging the view around one area.
        if (wanted.every(id => this.deps.heights.peekFine(id) !== undefined
            || this.deps.heights.isFineAbsent(id))) {
            return;
        }
        const generation = ++this.detailGeneration;
        await this.deps.heights.ensureLoadedAroundWorld(view.centreX, view.centreZ, radiusM);
        // The view moved while the tiles were in flight, or the panel closed.
        if (generation !== this.detailGeneration || !this.open) {
            return;
        }
        this.draw();
    }

    /** Put the current raster on the canvas and draw the overlays over it. */
    private blit(): void {
        const ctx = this.ctx;
        const img = this.raster.buffer(this.view);
        // The height shading is the floor, not the picture: the mesh paints
        // over it wherever it has something to say, and shows through only
        // where no tile covers the ground.
        this.cover.compositeInto(img.data, img.width, img.height);
        ctx.putImageData(new ImageData(img.data, img.width, img.height), 0, 0);
        this.drawAirfields(ctx);
        this.drawRoutes(ctx);
        this.drawFlights(ctx);
        this.drawPlayer(ctx);
    }

    /**
     * Refine the raster to full resolution, a band at a time.
     *
     * A one-sample-per-pixel pass over a fullscreen canvas is the better part
     * of a million inverse projections — hundreds of milliseconds, and the
     * panel would lock up on every pan. So it runs across frames on a time
     * budget, redrawing after each slice, and is abandoned the moment the view
     * moves. The generation counter is what makes abandoning safe: a frame
     * scheduled before the view changed must not paint over the one after.
     */
    private scheduleRefine(): void {
        const generation = ++this.refineGeneration;
        let y = 0;
        const tick = (): void => {
            if (generation !== this.refineGeneration || !this.open) {
                return;
            }
            const started = performance.now();
            const height = this.view.heightPx;
            do {
                const to = Math.min(height, y + REFINE_BAND_ROWS);
                this.raster.renderBand(this.view, 1, y, to);
                y = to;
            } while (y < height && performance.now() - started < REFINE_BUDGET_MS);

            this.blit();
            if (y < height) {
                this.refineHandle = requestAnimationFrame(tick);
            } else {
                this.refineHandle = undefined;
            }
        };
        this.refineHandle = requestAnimationFrame(tick);
    }

    private cancelRefine(): void {
        this.refineGeneration++;
        if (this.refineHandle !== undefined) {
            cancelAnimationFrame(this.refineHandle);
            this.refineHandle = undefined;
        }
    }

    /**
     * The airfields: pavement, not a centreline.
     *
     * The map is for planning a flight around real places, and an airfield is
     * the most recognisable thing on it — you find your bearings by the shape
     * of the field, not by a stroke and a label. Everything here is drawn from
     * the same OSM-derived records the scenery is built from, so what you see
     * on the chart is the thing you will fly over.
     *
     * Scaled by zoom: aprons and taxiways only once they are more than a few
     * pixels across, buildings only when they would be more than a dot. Below
     * that a runway line and a label say everything the scale can carry.
     */
    /** Turn this area's airfields into scene metres, once. */
    private projectAirfields(): void {
        const pt = (lat: number, lon: number): { x: number; z: number } => {
            const v = geodeticToWorld(this.deps.basis, lat, lon, 0);
            return { x: v.x, z: v.z };
        };
        const ring = (pts: number[][]): Float64Array => {
            const out = new Float64Array(pts.length * 2);
            for (let i = 0; i < pts.length; i++) {
                const p = pt(pts[i][0], pts[i][1]);
                out[i * 2] = p.x;
                out[i * 2 + 1] = p.z;
            }
            return out;
        };
        this.projectedAirfields = this.deps.airfields().map(field => ({
            aprons: field.aprons
                .filter(a => a.ring.length >= 3)
                .map(a => ring(a.ring)),
            taxiways: field.taxiways
                .filter(t => t.points.length >= 2)
                .map(t => ({ widthM: t.widthM, pts: ring(t.points) })),
            runways: field.runways
                .filter(r => r.thresholds.length >= 2)
                .map(r => {
                    const a = pt(r.thresholds[0][0], r.thresholds[0][1]);
                    const b = pt(r.thresholds[1][0], r.thresholds[1][1]);
                    return {
                        ax: a.x, az: a.z, bx: b.x, bz: b.z,
                        widthM: r.widthM,
                        paved: r.surface !== 'grass' && r.surface !== 'gravel',
                    };
                }),
            buildings: field.buildings.map(b => {
                const p = pt(b.lat, b.lon);
                return {
                    x: p.x, z: p.z,
                    heading: b.headingDeg * Math.PI / 180,
                    widthM: b.widthM, depthM: b.depthM, kind: b.kind as string,
                };
            }),
        }));
    }

    /**
     * The airfields: pavement, not a centreline.
     *
     * The map is for planning a flight around real places, and an airfield is
     * the most recognisable thing on one — you take your bearings from the shape
     * of the field, not from a stroke and a label. All of it comes from the same
     * OSM-derived records the scenery is built from, so what is on the chart is
     * what you will fly over.
     *
     * Detail arrives with zoom: pavement once a runway is more than a couple of
     * pixels wide, buildings once a hangar is more than a dot. Drawn earlier
     * they are noise that hides the terrain.
     */
    private drawAirfields(ctx: CanvasRenderingContext2D): void {
        const mPerPx = this.view.mPerPx;
        const showPavement = mPerPx < AIRFIELD_PAVEMENT_MPERPX;
        const showBuildings = mPerPx < AIRFIELD_BUILDING_MPERPX;

        if (showPavement) {
            // Aprons under taxiways under runways under buildings, so the
            // hierarchy reads the way it does from the air.
            for (const f of this.projectedAirfields) this.drawAprons(ctx, f);
            for (const f of this.projectedAirfields) this.drawTaxiways(ctx, f);
            for (const f of this.projectedAirfields) this.drawRunwayPavement(ctx, f);
            if (showBuildings) {
                for (const f of this.projectedAirfields) this.drawBuildings(ctx, f);
            }
        }
        this.drawRunwayLines(ctx, !showPavement);
    }

    private drawAprons(ctx: CanvasRenderingContext2D, field: ProjectedAirfield): void {
        ctx.fillStyle = APRON_FILL;
        for (const ring of field.aprons) {
            ctx.beginPath();
            for (let i = 0; i < ring.length; i += 2) {
                const p = worldToScreen(this.view, ring[i], ring[i + 1]);
                if (i === 0) { ctx.moveTo(p.x, p.y); } else { ctx.lineTo(p.x, p.y); }
            }
            ctx.closePath();
            ctx.fill();
        }
    }

    private drawTaxiways(ctx: CanvasRenderingContext2D, field: ProjectedAirfield): void {
        ctx.strokeStyle = TAXIWAY_STROKE;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const t of field.taxiways) {
            // Real width, floored at a hairline so one does not vanish between
            // zoom steps.
            ctx.lineWidth = Math.max(1, t.widthM / this.view.mPerPx);
            ctx.beginPath();
            for (let i = 0; i < t.pts.length; i += 2) {
                const p = worldToScreen(this.view, t.pts[i], t.pts[i + 1]);
                if (i === 0) { ctx.moveTo(p.x, p.y); } else { ctx.lineTo(p.x, p.y); }
            }
            ctx.stroke();
        }
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
    }

    /** Each runway as its actual paved rectangle, from its two thresholds. */
    private drawRunwayPavement(ctx: CanvasRenderingContext2D, field: ProjectedAirfield): void {
        for (const r of field.runways) {
            const a = worldToScreen(this.view, r.ax, r.az);
            const b = worldToScreen(this.view, r.bx, r.bz);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy);
            if (len < 1) {
                continue;
            }
            const half = Math.max(0.75, r.widthM / (2 * this.view.mPerPx));
            const nx = -dy / len * half;
            const ny = dx / len * half;
            ctx.fillStyle = r.paved ? RUNWAY_PAVED : RUNWAY_UNPAVED;
            ctx.beginPath();
            ctx.moveTo(a.x + nx, a.y + ny);
            ctx.lineTo(b.x + nx, b.y + ny);
            ctx.lineTo(b.x - nx, b.y - ny);
            ctx.lineTo(a.x - nx, a.y - ny);
            ctx.closePath();
            ctx.fill();
        }
    }

    private drawBuildings(ctx: CanvasRenderingContext2D, field: ProjectedAirfield): void {
        for (const b of field.buildings) {
            const centre = worldToScreen(this.view, b.x, b.z);
            const w = b.widthM / this.view.mPerPx;
            const d = b.depthM / this.view.mPerPx;
            if (w < 1.5 && d < 1.5) {
                continue;
            }
            // The footprint's long axis is a true bearing, and north is up, so
            // the rotation is measured from vertical.
            const ux = Math.sin(b.heading), uy = -Math.cos(b.heading);
            const vx = Math.cos(b.heading), vy = Math.sin(b.heading);
            const hw = Math.max(0.75, w / 2);
            const hd = Math.max(0.75, d / 2);
            ctx.fillStyle = BUILDING_FILL[b.kind] ?? BUILDING_FILL.hangar;
            ctx.beginPath();
            ctx.moveTo(centre.x + ux * hd + vx * hw, centre.y + uy * hd + vy * hw);
            ctx.lineTo(centre.x + ux * hd - vx * hw, centre.y + uy * hd - vy * hw);
            ctx.lineTo(centre.x - ux * hd - vx * hw, centre.y - uy * hd - vy * hw);
            ctx.lineTo(centre.x - ux * hd + vx * hw, centre.y - uy * hd + vy * hw);
            ctx.closePath();
            ctx.fill();
        }
    }

    /** Centreline and label. The only airfield mark left when zoomed out. */
    private drawRunwayLines(ctx: CanvasRenderingContext2D, withLine: boolean): void {
        ctx.strokeStyle = '#e8e8e8';
        ctx.fillStyle = '#e8e8e8';
        ctx.lineWidth = 1.5;
        ctx.font = '10px monospace';
        for (const r of this.deps.sceneRunways) {
            if (!r.primary) {
                continue;
            }
            const dx = Math.sin(r.heading) * r.halfLength;
            const dz = Math.cos(r.heading) * r.halfLength;
            const a = worldToScreen(this.view, r.center.x - dx, r.center.z - dz);
            const b = worldToScreen(this.view, r.center.x + dx, r.center.z + dz);
            if (withLine) {
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
            ctx.fillText(r.icao || r.name, b.x + 4, b.y - 4);
        }
    }

    private drawRoutes(ctx: CanvasRenderingContext2D): void {
        const doc = this.edit.doc;
        const selected = this.selectedRouteId();
        for (let i = 0; i < doc.routes.length; i++) {
            const route = doc.routes[i];
            const colour = ROUTE_COLOURS[i % ROUTE_COLOURS.length];
            const pts = route.legs.map(l => {
                const w = this.legWorld(l.at);
                return worldToScreen(this.view, w.x, w.z);
            });
            if (pts.length === 0) {
                continue;
            }
            ctx.strokeStyle = colour;
            ctx.lineWidth = route.id === selected ? 2 : 1;
            ctx.globalAlpha = route.id === selected ? 1 : 0.55;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (const p of pts.slice(1)) {
                ctx.lineTo(p.x, p.y);
            }
            if (route.loop && pts.length > 2) {
                ctx.closePath();
            }
            ctx.stroke();

            const sel = this.edit.selection;
            ctx.font = '10px monospace';
            for (let n = 0; n < pts.length; n++) {
                const isSel = sel.kind === 'leg' && sel.routeId === route.id
                    && sel.legId === route.legs[n].id;
                ctx.fillStyle = isSel ? '#ffffff' : colour;
                ctx.beginPath();
                ctx.arc(pts[n].x, pts[n].y, isSel ? 6 : 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#101418';
                ctx.fillText(String(n + 1), pts[n].x - 3, pts[n].y + 3);
            }
            ctx.globalAlpha = 1;
        }
    }

    private drawFlights(ctx: CanvasRenderingContext2D): void {
        const sel = this.edit.selection;
        ctx.font = '10px monospace';
        for (const f of this.edit.doc.flights) {
            const w = this.legWorld(f.start.position);
            const p = worldToScreen(this.view, w.x, w.z);
            const isSel = sel.kind === 'flight' && sel.flightId === f.id;
            ctx.fillStyle = f.faction === 'enemy' ? '#ff7f7f' : '#7fb0ff';
            ctx.strokeStyle = isSel ? '#ffffff' : ctx.fillStyle;
            ctx.lineWidth = isSel ? 2 : 1;
            // A triangle pointing along the spawn heading, so the direction a
            // flight starts on is visible without opening the inspector.
            const h = Math.PI - f.start.headingDeg * Math.PI / 180;
            const fx = Math.sin(h), fz = Math.cos(h);
            ctx.beginPath();
            ctx.moveTo(p.x + fx * 9, p.y + fz * 9);
            ctx.lineTo(p.x - fz * 5 - fx * 5, p.y + fx * 5 - fz * 5);
            ctx.lineTo(p.x + fz * 5 - fx * 5, p.y - fx * 5 - fz * 5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#e8e8e8';
            ctx.fillText(`${f.name ?? f.id} ×${f.count}`, p.x + 10, p.y - 6);
        }
    }

    private drawPlayer(ctx: CanvasRenderingContext2D): void {
        const start = this.edit.doc.player;
        const at = start.position;
        if (at === undefined) {
            return;
        }
        const w = this.legWorld(at);
        const p = worldToScreen(this.view, w.x, w.z);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 7, p.y);
        ctx.lineTo(p.x + 7, p.y);
        ctx.moveTo(p.x, p.y - 7);
        ctx.lineTo(p.x, p.y + 7);
        ctx.stroke();
    }
}
