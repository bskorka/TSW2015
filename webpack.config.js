module.exports = {
    devtool :'source-map',
    entry: "./client/scripts/app.js",
    output: {
        path: "./client/dist/",
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.less$/, loader: "style!css!less" },
            { test: /bootstrap\/js\//, loader: 'imports?jQuery=jquery' },
            { test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,   loader: "url?limit=10000&minetype=application/font-woff" },
            { test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=application/octet-stream" },
            { test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,    loader: "file" },
            { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,    loader: "url?limit=10000&minetype=image/svg+xml" },
            { test: /\.png$/, loader: "url-loader?minetype=image/png" }
        ]
    }
};