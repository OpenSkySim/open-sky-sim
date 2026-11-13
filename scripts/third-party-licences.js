/**
 * Records every npm package whose code ends up in the build, the web workers'
 * bundles included, and emits their licences next to bundle.js:
 *
 *   third-party-licences.txt   the full licence (and NOTICE) text of each package
 *   third-party-licences.json  name, version, licence and homepage, for the About tab
 *
 * MIT, Apache-2.0 and the like require their notice to travel with every copy,
 * and Terser's bundle.js.LICENSE.txt only keeps the few packages that mark a
 * banner comment as a licence, so this is what the published game ships instead.
 */
const fs = require('fs');
const path = require('path');

const NOTICE_FILE = /^(licen[cs]e|copying|notice)(\.(md|txt|markdown))?$/i;

/** The directory of the package a bundled file belongs to, or undefined outside node_modules. */
function packageRoot(resource, cache) {
    if (!resource || !resource.includes(`${path.sep}node_modules${path.sep}`)) {
        return undefined;
    }
    let dir = path.dirname(resource);
    const seen = [];
    while (dir.includes(`${path.sep}node_modules`)) {
        if (cache.has(dir)) {
            const root = cache.get(dir);
            seen.forEach(d => cache.set(d, root));
            return root;
        }
        seen.push(dir);
        const file = path.join(dir, 'package.json');
        if (fs.existsSync(file)) {
            // Subfolders often carry a stub package.json ({"type": "module"});
            // the package itself is the one with a name and a version.
            const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
            if (pkg.name && pkg.version) {
                seen.forEach(d => cache.set(d, dir));
                return dir;
            }
        }
        dir = path.dirname(dir);
    }
    return undefined;
}

function homepageOf(pkg) {
    if (pkg.homepage) {
        return pkg.homepage;
    }
    const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    if (!repo) {
        return `https://www.npmjs.com/package/${pkg.name}`;
    }
    return repo
        .replace(/^git\+/, '')
        .replace(/^git:\/\//, 'https://')
        .replace(/^github:/, 'https://github.com/')
        .replace(/\.git$/, '');
}

function licenceOf(pkg) {
    if (typeof pkg.license === 'string') {
        return pkg.license;
    }
    if (pkg.license?.type) {
        return pkg.license.type;
    }
    if (Array.isArray(pkg.licenses)) {
        return pkg.licenses.map(l => l.type ?? l).join(' OR ');
    }
    return 'UNKNOWN';
}

class ThirdPartyLicencesPlugin {
    apply(compiler) {
        const NAME = 'ThirdPartyLicencesPlugin';
        let roots = new Set();
        const cache = new Map();

        // thisCompilation fires for the main compiler only, so a rebuild starts clean...
        compiler.hooks.thisCompilation.tap(NAME, compilation => {
            roots = new Set();
            const { Compilation, sources } = compiler.webpack;
            compilation.hooks.processAssets.tap(
                { name: NAME, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
                () => {
                    const packages = [...roots]
                        .map(dir => ({ dir, pkg: JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) }))
                        .sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));
                    const list = packages.map(({ pkg }) => ({
                        name: pkg.name,
                        version: pkg.version,
                        licence: licenceOf(pkg),
                        homepage: homepageOf(pkg),
                    }));
                    const text = packages.map(({ dir, pkg }) => {
                        const files = fs.readdirSync(dir).filter(f => NOTICE_FILE.test(f)).sort();
                        const body = files.length
                            ? files.map(f => fs.readFileSync(path.join(dir, f), 'utf8').trim()).join('\n\n')
                            : `(The package ships no licence file. Its package.json declares: ${licenceOf(pkg)}.)`;
                        return `${pkg.name} ${pkg.version}\n${licenceOf(pkg)} · ${homepageOf(pkg)}\n\n${body}`;
                    }).join(`\n\n${'='.repeat(78)}\n\n`);
                    const header = 'Open-source libraries bundled into Open Sky Sim, with their licences.\n\n'
                        + `${'='.repeat(78)}\n\n`;
                    compilation.emitAsset('third-party-licences.txt', new sources.RawSource(header + text + '\n'));
                    compilation.emitAsset('third-party-licences.json', new sources.RawSource(JSON.stringify(list, null, 2) + '\n'));
                },
            );
        });

        // ...while compilation also fires for the worker child compilers, which run
        // inside the main compilation and so finish before it emits.
        compiler.hooks.compilation.tap(NAME, compilation => {
            compilation.hooks.finishModules.tap(NAME, modules => {
                for (const module of modules) {
                    const root = packageRoot(module.resource ?? module.rootModule?.resource, cache);
                    if (root) {
                        roots.add(root);
                    }
                    for (const inner of module.modules ?? []) {
                        const innerRoot = packageRoot(inner.resource, cache);
                        if (innerRoot) {
                            roots.add(innerRoot);
                        }
                    }
                }
            });
        });
    }
}

module.exports = { ThirdPartyLicencesPlugin };
