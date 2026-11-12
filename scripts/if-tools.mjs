// Runs an npm script only when the private tools/ submodule is checked out.
// The public game builds without it; the bake tools, mod packing and the dev
// server live in OpenSkySim/open-sky-sim-server, mounted at tools/.
import { spawnSync } from 'child_process';
import fs from 'fs';

const [script] = process.argv.slice(2);
if (!fs.existsSync('tools/package.json') && !fs.existsSync('tools/dev.mjs')) {
    console.log(`[if-tools] tools/ submodule not checked out, skipping "${script}".`);
    process.exit(0);
}
const r = spawnSync('npm', ['run', script], { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
