/**
 * Aircraft packs that ship with the game, so they fly without a modserver
 * (static hosting included). They are built by blender/lowpoly_aircraft and
 * copied to dist/assets/packs by the webpack config.
 */
export interface PackEntry {
    id: string;
    packUrl: string;
}

export const BUILTIN_PACKS: readonly PackEntry[] = [
    { id: 'lp_yak44', packUrl: 'assets/packs/lp_yak44.aircraft.pack' },
];

/** The built-in packs plus the modserver's; a pack the server lists replaces the built-in one of that id. */
export function mergePackLists(server: readonly PackEntry[], builtin: readonly PackEntry[] = BUILTIN_PACKS): PackEntry[] {
    const served = new Set(server.map(p => p.id));
    for (const p of builtin) {
        if (served.has(p.id)) {
            const url = server.find(s => s.id === p.id)?.packUrl;
            console.info(`[packs] ${p.id}: the modserver's pack (${url}) replaces the built-in ${p.packUrl}`);
        }
    }
    return [...builtin.filter(p => !served.has(p.id)), ...server];
}
