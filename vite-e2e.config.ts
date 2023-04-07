import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        deps: {
            inline: ["@weichwarenprojekt/ts-importer"],
        },
        exclude: [...defaultExclude, "tests/bin/*", "tests/lib/*"],
    },
});
