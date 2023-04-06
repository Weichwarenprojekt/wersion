import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fs, vol } from "memfs";
import { config } from "../../src/lib/config";
import { CliOptionsModel } from "../../src/models/cli-options.model";
import _ from "lodash";
import { defaultWersionConfig } from "../../src/models/wersion-config.model";
import { logger } from "../../src/lib/util";

vi.mock("node:fs", () => ({ ...fs, default: fs }));

describe("config test", function () {
    beforeEach(async () => {
        const files = {
            ".wersionrc.ts": `export const configuration = {
                versionFile: "version.json",
                changelogFilePath: "CHANGELOG.md",
            }`,
            ".wersionrc.empty.ts": "",
        };
        vol.fromJSON(files);
        await config.loadConfigFile("./.wersionrc.ts");
    });

    afterEach(() => {
        vol.reset();
        vi.clearAllMocks();
    });

    it("should return config parsed from config file", () => {
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

        config.set(cliOptions);
        expect(config.config).toMatchObject(
            _.merge({}, defaultWersionConfig, cliOptions, {
                versionFile: "version.json",
                changelogFilePath: "CHANGELOG.md",
            }),
        );
    });

    it("should emit warning if config was found", () => {
        const cliOptions: CliOptionsModel = {
            config: "./.wersionrc.empty.ts",
            dryRun: true,
        };
        config.set(cliOptions);
        const warn = vi.spyOn(logger, "warn");
        config.loadConfigFile(cliOptions.config);
        expect(warn).toBeCalledWith('The specified configuration does not export a "configuration"');
    });
});
