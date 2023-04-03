import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fs, vol } from "memfs";
import { config } from "../../src/lib/config";
import { CliOptionsModel } from "../../src/models/cli-options.model";
import _ from "lodash";
import { defaultWersionConfig } from "../../src/models/wersion-config.model";

vi.mock("fs", async () => {
    return {
        ...fs,
        default: { ...fs },
    };
});

describe("config test", function () {
    beforeEach(async () => {
        const files = {
            ".wersionrc.ts": `export const configuration = {
                versionFile: "version.json",
                changelogFilePath: "CHANGELOG.md",
            }`,
        };
        vol.fromJSON(files);
        await config.loadConfigFile("./.wersionrc.ts");
    });

    afterEach(() => {
        vol.reset();
        vi.clearAllMocks();
    });

    it("should return config parsed from config file", () => {
        console.log(defaultWersionConfig);
        expect(config.config).toMatchObject(
            _.merge({}, defaultWersionConfig, {
                versionFile: "version.json",
                changelogFilePath: "CHANGELOG.md",
            }),
        );
    });

    it("should append passed cli options to the config", () => {
        const cliOptions: CliOptionsModel = {
            config: "./wersionrc.ts",
            dryRun: true,
        };

        console.log(config.config);
        config.set(cliOptions);

        expect(config.config).toMatchObject(_.merge({}, defaultWersionConfig, cliOptions));
    });
});
