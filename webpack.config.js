const CopyPlugin = require('copy-webpack-plugin');
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
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/*',
                    to: '[name][ext]'
                },
                {
                    from: 'assets/*',
                    to: 'assets/[name][ext]',
                    filter: (resourcePath) => !isModAsset(resourcePath),
                }
            ]
        })
    ]
}
