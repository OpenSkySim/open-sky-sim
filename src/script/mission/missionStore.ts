/**
 * Where missions come from and go to, from the browser's side.
 *
 * Three tiers, because there is no single answer:
 *
 *  1. **The dev server.** `npm start` / `npm run serve` puts `/api/missions`
 *     behind the game and everything works — list, load, save, delete.
 *  2. **A static build, reading.** The published game is `dist/` on GitHub
 *     Pages with no `/api/*` at all. Missions published by
 *     `npm run pack-missions` are bundled under `assets/missions/`, and the
 *     index there is read instead.
 *  3. **A static build, writing.** Save becomes a file download, and a file
 *     input reads one back. Both halves, deliberately: a mission you can save
 *     and never reopen is not a fallback, it is a data-loss bug with a
 *     progress indicator.
 *
 * Which tier is live is decided once, by probing `/api/health` the way
 * `Game.importModFromFile` already does, and the panel puts the reason on the
 * disabled control rather than just greying it out.
 */

import { MissionDoc } from './missionFormat';
import { MissionIssue, validateMission } from './missionValidate';

export interface MissionSummary {
    id: string;
    name: string;
    area: string;
    savedUtc?: string;
}

export interface SaveResult {
    ok: boolean;
    savedUtc?: string;
    errors?: MissionIssue[];
    /** Set when the save fell back to a download. */
    downloaded?: boolean;
    error?: string;
}

const API = '/api/missions';
const BUNDLED_INDEX = '/assets/missions/index.json';

export class MissionStore {

    /** undefined until the first probe resolves. */
    private serverAvailable: boolean | undefined;

    /**
     * Whether the dev server is behind us. Probed once and cached: the answer
     * cannot change without a reload, and re-probing on every list would put a
     * failing request in the console each time the panel opens.
     */
    async hasServer(): Promise<boolean> {
        if (this.serverAvailable !== undefined) {
            return this.serverAvailable;
        }
        try {
            const res = await fetch('/api/health');
            const body = res.ok ? await res.json() : undefined;
            this.serverAvailable = body?.missions === true;
        } catch {
            // A static host answers the game's own index.html for /api/health,
            // so this is a JSON parse failure as often as a network one.
            this.serverAvailable = false;
        }
        return this.serverAvailable;
    }

    /** Why saving is unavailable, or undefined when it is available. */
    async saveBlockedBecause(): Promise<string | undefined> {
        return await this.hasServer()
            ? undefined
            : 'no dev server — run npm start to save; Download writes a file instead';
    }

    async list(): Promise<MissionSummary[]> {
        const url = await this.hasServer() ? API : BUNDLED_INDEX;
        try {
            const res = await fetch(url);
            if (!res.ok) {
                return [];
            }
            const body = await res.json();
            return Array.isArray(body) ? body as MissionSummary[] : [];
        } catch {
            // Degrade to an empty list rather than throwing into the panel's
            // open path: a build with no bundled missions is normal.
            return [];
        }
    }

    async load(id: string): Promise<{ doc?: MissionDoc; errors?: MissionIssue[]; error?: string }> {
        const url = await this.hasServer()
            ? `${API}/${encodeURIComponent(id)}`
            : `/assets/missions/${encodeURIComponent(id)}.mission.json`;
        try {
            const res = await fetch(url);
            const body = await res.json();
            if (!res.ok) {
                return { errors: body?.errors, error: body?.error ?? `HTTP ${res.status}` };
            }
            // Validated on the way in even from our own server: the file may
            // have been hand-edited since it was written, and the paths are
            // what let the panel point at what broke.
            const v = validateMission(body);
            return v.ok ? { doc: v.doc } : { errors: v.errors };
        } catch (err) {
            return { error: (err as Error).message };
        }
    }

    async save(doc: MissionDoc): Promise<SaveResult> {
        if (!await this.hasServer()) {
            this.download(doc);
            return { ok: true, downloaded: true };
        }
        try {
            const res = await fetch(`${API}/${encodeURIComponent(doc.id)}`, {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(doc),
            });
            const body = await res.json();
            if (!res.ok) {
                return { ok: false, errors: body?.errors, error: body?.error };
            }
            return { ok: true, savedUtc: body?.savedUtc };
        } catch (err) {
            return { ok: false, error: (err as Error).message };
        }
    }

    async remove(id: string): Promise<{ ok: boolean; error?: string }> {
        if (!await this.hasServer()) {
            return { ok: false, error: 'no dev server — nothing to delete from' };
        }
        try {
            const res = await fetch(`${API}/${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (!res.ok) {
                const body = await res.json().catch(() => undefined);
                return { ok: false, error: body?.error ?? `HTTP ${res.status}` };
            }
            return { ok: true };
        } catch (err) {
            return { ok: false, error: (err as Error).message };
        }
    }

    /** The static-build save: hand the file to the browser. */
    download(doc: MissionDoc): void {
        const blob = new Blob([`${JSON.stringify(doc, null, 2)}\n`],
            { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.id}.mission.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /** The other half of the fallback: read a downloaded mission back in. */
    async importFile(file: File): Promise<{ doc?: MissionDoc; errors?: MissionIssue[]; error?: string }> {
        try {
            const v = validateMission(JSON.parse(await file.text()));
            return v.ok ? { doc: v.doc } : { errors: v.errors };
        } catch (err) {
            return { error: `not a mission file: ${(err as Error).message}` };
        }
    }
}
