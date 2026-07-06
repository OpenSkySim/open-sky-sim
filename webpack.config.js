const CopyPlugin = require('copy-webpack-plugin');

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
                    to: 'assets/[name][ext]'
                }
            ]
        })
    ]
}
