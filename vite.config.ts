import { defaultExclude, defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
    test: {
        server: {
            deps: {
                inline: ["@weichwarenprojekt/ts-importer"],
            },
        },
        exclude: [...defaultExclude],
        coverage: {
            // you can include other reporters, but 'json-summary' is required, json is recommended
            reporter: ["text", "json-summary", "json"],
            exclude: [...coverageConfigDefaults.exclude, "./esbuild.js"],
        },
    },
});
