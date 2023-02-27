import esbuild from "esbuild";
import fs from "fs";

// Read in package json
const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

// Delete the dist folder
const deleteDist = () => fs.rmSync("dist", { force: true, recursive: true });
deleteDist();

// Bundle the cli
esbuild
    .build({
        entryPoints: ["./src/bin/cli.ts"],
        minify: true,
        bundle: true,
        format: "esm",
        outfile: "./dist/wersion.js",
        platform: "node",
        external: Object.keys(packageJson.dependencies),
    })
    .catch(deleteDist);
