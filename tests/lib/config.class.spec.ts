import * as fs from "fs";
import { ConfigModel } from "../../src/models/config";
import { Config } from "../../src/lib/config.class";

jest.mock("fs");

const fsMocked = jest.mocked(fs);

describe("config class test", function () {
    beforeEach(() => {
        fsMocked.readFileSync.mockReturnValue(
            new Buffer(
                JSON.stringify({
                    versionFile: "version.json",
                    changelogFilePath: "CHANGELOG.md",
                } as unknown as ConfigModel),
            ),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should return config parsed from config file", () => {
        expect(Config.getInstance().config).toMatchObject({
            versionFile: "version.json",
            changelogFilePath: "CHANGELOG.md",
        });
    });
});
