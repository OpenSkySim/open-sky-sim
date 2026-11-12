/**
 * Visitor count on the boot dialog, from GoatCounter (no cookies, no personal
 * data). The game is a static Pages site with no server, so the count lives
 * there: a pixel request records the visit, and the public counter JSON gives
 * the total (the site's "Allow adding visitor counts on your website" setting
 * must be on, or TOTAL.json answers 403 and the line stays hidden).
 *
 * Only the live site records visits; localhost and other hosts never do.
 * `?visitors` in the URL shows the total read-only anywhere, for checking.
 */

export const GOATCOUNTER_CODE = 'openskysim';
const PRODUCTION_HOST = 'openskysim.github.io';
const FETCH_TIMEOUT_MS = 3000;

const counterBase = (): string => `https://${GOATCOUNTER_CODE}.goatcounter.com`;

/** Whether a page on this host should add itself to the count. */
export function shouldRecordVisit(hostname: string): boolean {
    return hostname === PRODUCTION_HOST;
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

export function formatVisitorLine(total: number, locale?: string): string {
    return `${total.toLocaleString(locale)} ${total === 1 ? 'visit' : 'visits'} so far`;
}

function recordVisit(): void {
    const params = new URLSearchParams({
        p: location.pathname,
        t: document.title,
        r: document.referrer,
        s: `${screen.width},${screen.height},${window.devicePixelRatio || 1}`,
        rnd: Math.random().toString(36).slice(2),
    });
    new Image().src = `${counterBase()}/count?${params.toString()}`;
}

/** Fetches the total, or undefined on any failure (blocked, offline, slow, 403). */
export async function fetchVisitorTotal(fetchFn: typeof fetch = fetch, timeoutMs = FETCH_TIMEOUT_MS): Promise<number | undefined> {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    try {
        const res = await fetchFn(`${counterBase()}/counter/TOTAL.json`, { signal: abort.signal, cache: 'no-store' });
        if (!res.ok) {
            return undefined;
        }
        return parseCounterTotal(await res.json());
    } catch {
        return undefined;
    } finally {
        clearTimeout(timer);
    }
}

/** Records this visit (live site only) and shows the total on the boot dialog. Never throws, never blocks boot. */
export function recordAndShowVisitorCount(): void {
    const record = shouldRecordVisit(location.hostname);
    if (!record && !new URLSearchParams(location.search).has('visitors')) {
        return;
    }
    if (record) {
        recordVisit();
    }
    void fetchVisitorTotal().then(total => {
        const line = document.getElementById('boot-visitors');
        if (total === undefined || !line) {
            return;
        }
        line.textContent = formatVisitorLine(total);
        line.classList.remove('hidden');
    });
}
