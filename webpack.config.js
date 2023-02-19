const path = require("node:path");
const ShebangPlugin = require("webpack-shebang-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    target: "node",
    entry: {
        wersion: "./src/bin/cli.ts",
    },
    devtool: "inline-source-map",
    plugins: [new ShebangPlugin()],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    optimization: {
        minimizer: [new TerserPlugin({ extractComments: false })],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    },
};
