import { fs, vol } from "memfs";
import { Config } from "../../src/lib/config.class";
import { CliOptions } from "../../src/models/cli-options";

jest.mock("fs", () => ({ ...fs }));

describe("config class test", function () {
    beforeEach(() => {
        const files = {
            ".wersionrc.json": JSON.stringify({
                versionFile: "version.json",
                changelogFilePath: "CHANGELOG.md",
            }),
        };
        vol.fromJSON(files);
    });

    afterEach(() => {
        vol.reset();
        jest.clearAllMocks();
    });

    it("should return config parsed from config file", () => {
        expect(Config.getInstance().config).toMatchObject({
            versionFile: "version.json",
            changelogFilePath: "CHANGELOG.md",
        });
    });

    it("should append passed cli options to the config", () => {
        const cliOptions: CliOptions = {
            dryRun: true,
        };

        Config.getInstance().set(cliOptions);

        expect(Config.getInstance().config).toMatchObject({
            versionFile: "version.json",
            changelogFilePath: "CHANGELOG.md",
            dryRun: true,
        });
    });
});
