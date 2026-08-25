const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

const modPrefixes = fs.readdirSync('assets')
    .filter(f => f.endsWith('.aircraft.json'))
    .map(f => f.slice(0, -'.aircraft.json'.length));

function isModAsset(resourcePath) {
    const base = path.basename(resourcePath);
    return modPrefixes.some(p =>
        base === `${p}.aircraft.json` || base.startsWith(`${p}_`));
}

module.exports = {
    entry: './src/script/index.ts',
    devtool: 'inline-source-map',
    output: {
        path: __dirname + '/dist',
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                // @0x62/jsbsim-wasm ships its Emscripten glue module and the wasm
                // binary and references them via `new URL(..., import.meta.url)`
                // (see its dist/wasm.js). Treat both as raw, uncompiled assets so
                // webpack copies them to the output and rewrites the URLs, instead
                // of trying to parse the Emscripten glue as a normal JS module.
                test: /\.(wasm|mjs)$/,
                type: 'asset/resource',
                include: path.resolve(__dirname, 'node_modules/@0x62/jsbsim-wasm'),
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        // clean-pslg (via box-intersect -> typedarray-pool) references Node's
        // `buffer`/`global` — webpack 5 no longer polyfills Node core modules
        // by default, so wire in the minimal shims it needs.
        fallback: {
            buffer: require.resolve('buffer/'),
        },
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
            global: 'globalThis',
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/index.html',
                    to: 'index.html',
                    transform(content) {
                        return content.toString().replace(
                            'src="./bundle.js"',
                            `src="./bundle.js?v=${Date.now()}"`,
                        );
                    },
                },
                {
                    from: 'src/style.css',
                    to: 'style.css',
                },
                {
                    from: 'assets/*',
                    to: 'assets/[name][ext]',
                    filter: (resourcePath) => !isModAsset(resourcePath),
                },
                {
                    // Bundled JSBSim aircraft/engine/systems data (see assets/jsbsim/),
                    // fetched at runtime by the JSBSim worker. Copied as a whole
                    // directory tree so the JSBSim-native folder layout survives.
                    from: 'assets/jsbsim',
                    to: 'assets/jsbsim',
                },
                {
                    // Planet DEM height tiles (see tools/bake_planet_dem.py).
                    from: 'assets/planet',
                    to: 'assets/planet',
                    noErrorOnMissing: true,
                }
            ]
        })
    ]
}
