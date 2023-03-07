import esbuild from "esbuild";
import fs from "fs";
import packageJson from "./package.json" assert { type: "json" };

// Delete the dist folder
const deleteDist = () => fs.rmSync("dist", { force: true, recursive: true });
deleteDist();

// Bundle the cli
const options = {
    minify: true,
    bundle: true,
    platform: "node",
    external: Object.keys(packageJson.dependencies),
};
esbuild
    .build({
        ...options,
        entryPoints: ["./src/bin/cli.ts"],
        format: "cjs",
        outfile: "./dist/wersion.js",
    })
    .catch(deleteDist);
esbuild
    .build({
        ...options,
        entryPoints: ["./src/models/wersion-config.model.ts"],
        format: "cjs",
        outfile: "./dist/wersion-lib.cjs",
    })
    .catch(deleteDist);
esbuild
    .build({
        ...options,
        entryPoints: ["./src/models/wersion-config.model.ts"],
        format: "esm",
        outfile: "./dist/wersion-lib.mjs",
    })
    .catch(deleteDist);
