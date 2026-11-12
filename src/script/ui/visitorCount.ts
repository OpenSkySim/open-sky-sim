/**
 * Visitor counts on the boot dialog, from GoatCounter (no cookies, no personal
 * data). The game is a static Pages site with no server, so the counts live
 * there: pixel requests record them, and the public per-path counter JSON
 * reads them back (the site's "Allow adding visitor counts on your website"
 * setting must be on, or the JSON answers 403 and the line stays hidden).
 *
 * Two paths, because the public counter gives one number per path:
 * - the page path counts visits (GoatCounter's sessions: a reload within its
 *   8 h session does not count again, a return visit later does);
 * - UNIQUE_PATH is recorded once per browser (remembered in localStorage), so
 *   its count is unique visitors. Clearing site data counts the browser again.
 *
 * Only the live site records; localhost and other hosts never do.
 * `?visitors` in the URL shows the counts read-only anywhere, for checking.
 * GoatCounter caches the counter JSON for up to four hours.
 */

export const GOATCOUNTER_CODE = 'openskysim';
const PRODUCTION_HOST = 'openskysim.github.io';
/** The page path visits are recorded under (location.pathname on the live site). */
export const VISITS_PATH = '/open-sky-sim/';
export const UNIQUE_PATH = '/open-sky-sim/unique-visitor';
const UNIQUE_STORAGE_KEY = 'goatcounter-unique-recorded';
const FETCH_TIMEOUT_MS = 3000;

const counterBase = (): string => `https://${GOATCOUNTER_CODE}.goatcounter.com`;

/** Whether a page on this host should add itself to the counts. */
export function shouldRecordVisit(hostname: string): boolean {
    return hostname === PRODUCTION_HOST;
}

/** The public counter URL for one path. */
export function counterUrl(path: string): string {
    return `${counterBase()}/counter/${encodeURIComponent(path)}.json`;
}

/**
 * The total from GoatCounter's counter JSON. `count` is a pre-formatted string
 * ("1 234", "1,234" or with a thin space, by the site's locale), so the digits
 * are read out of it. Undefined for anything that is not a count.
 */
export function parseCounterTotal(json: unknown): number | undefined {
    if (typeof json !== 'object' || json === null) {
        return undefined;
    }
    const raw = (json as { count?: unknown }).count;
    if (typeof raw === 'number') {
        return Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : undefined;
    }
    if (typeof raw !== 'string') {
        return undefined;
    }
    const digits = raw.replace(/\D/g, '');
    return digits === '' ? undefined : Number(digits);
}

const plural = (n: number, one: string, many: string, locale?: string): string =>
    `${n.toLocaleString(locale)} ${n === 1 ? one : many}`;

/** The boot line for whichever counts arrived; undefined when neither did. */
export function formatVisitorLine(unique: number | undefined, visits: number | undefined, locale?: string): string | undefined {
    const parts: string[] = [];
    if (unique !== undefined) {
        parts.push(plural(unique, 'unique visitor', 'unique visitors', locale));
    }
    if (visits !== undefined) {
        parts.push(plural(visits, 'visit', 'visits', locale));
    }
    return parts.length === 0 ? undefined : parts.join(' · ');
}

function sendPixel(path: string, title: string): void {
    const params = new URLSearchParams({
        p: path,
        t: title,
        r: document.referrer,
        s: `${screen.width},${screen.height},${window.devicePixelRatio || 1}`,
        rnd: Math.random().toString(36).slice(2),
    });
    new Image().src = `${counterBase()}/count?${params.toString()}`;
}

/** True the first time this browser asks; false after, or when storage is unavailable (so it never over-counts). */
export function claimFirstVisit(storage: Pick<Storage, 'getItem' | 'setItem'> | undefined): boolean {
    try {
        if (!storage || storage.getItem(UNIQUE_STORAGE_KEY) !== null) {
            return false;
        }
        storage.setItem(UNIQUE_STORAGE_KEY, new Date().toISOString());
        return storage.getItem(UNIQUE_STORAGE_KEY) !== null;
    } catch {
        return false;
    }
}

function localStorageOrUndefined(): Storage | undefined {
    try {
        return window.localStorage;
    } catch {
        return undefined;
    }
}

/** Fetches one path's total, or undefined on any failure (blocked, offline, slow, 403). */
export async function fetchCounterTotal(path: string, fetchFn: typeof fetch = fetch, timeoutMs = FETCH_TIMEOUT_MS): Promise<number | undefined> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    try {
        const res = await fetchFn(counterUrl(path), { signal: abort.signal });
        // A path nobody has recorded yet answers 404 with a count of 0 in the body.
        if (!res.ok && res.status !== 404) {
            return undefined;
        }
        return parseCounterTotal(await res.json());
    } catch {
        return undefined;
    } finally {
        clearTimeout(timer);
    }
}

/** Records this visit (live site only) and shows the counts on the boot dialog. Never throws, never blocks boot. */
export function recordAndShowVisitorCount(): void {
    const record = shouldRecordVisit(location.hostname);
    if (!record && !new URLSearchParams(location.search).has('visitors')) {
        return;
    }
    if (record) {
        sendPixel(location.pathname, document.title);
        if (claimFirstVisit(localStorageOrUndefined())) {
            sendPixel(UNIQUE_PATH, 'Unique visitor');
        }
    }
    void Promise.all([fetchCounterTotal(UNIQUE_PATH), fetchCounterTotal(VISITS_PATH)]).then(([unique, visits]) => {
        const text = formatVisitorLine(unique, visits);
        const line = document.getElementById('boot-visitors');
        if (text === undefined || !line) {
            return;
        }
        line.textContent = text;
        line.classList.remove('hidden');
    });
}
