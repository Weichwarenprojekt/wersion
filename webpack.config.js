const path = require("node:path");
const ShebangPlugin = require("webpack-shebang-plugin");

module.exports = {
    target: "node",
    entry: {
        wersion: "./src/bin/cli.ts",
    },
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
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
    },
};
