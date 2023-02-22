import { fs, vol } from "memfs";
import { Version } from "../../src/models/version";
jest.mock("fs", () => ({ ...fs }));

import { getPackageVersion, setPackageVersion } from "../../src/lib/version-file";
import { Config } from "../../src/lib/config.class";

const filesJson = {
    "package.json": JSON.stringify({ name: "wersion-unit-test", version: "0.1.0", versionFile: {} }),
    ".wersionrc.json": JSON.stringify({
        versionFile: {
            path: "./package.json",
            matcher: '"version": ?"([0-9.]+)"',
        },
        commitTypes: {
            major: [],
            minor: ["feat"],
            patch: ["fix"],
        },
        breakingChangeTrigger: "breaking change",
        changelogFilePath: "./CHANGELOG.md",
    }),
};

describe("version-file test", function () {
    beforeEach(() => {
        vol.fromJSON(filesJson);
        Config.getInstance().loadConfigFile();
    });

    afterEach(() => {
        jest.clearAllMocks();
        vol.reset();
    });

    describe("getPackageVersion", function () {
        it("should return the package version from the version file", async () => {
            const version = await getPackageVersion();
            expect(version.toString()).toEqual("0.1.0");
        });

        it("should throw whether the version file does not exist", async () => {
            fs.writeFileSync(
                ".wersionrc.json",
                JSON.stringify({
                    versionFile: {
                        path: "./packageeeeeeee.json",
                        matcher: '"version": "([0-9.]+)"',
                    },
                }),
            );

            Config.getInstance().loadConfigFile();

            await expect(getPackageVersion()).rejects.toThrowError("No version file exists in the current directory");
        });

        it("should throw whether no version can be found in version file", async () => {
            fs.writeFileSync(
                ".wersionrc.json",
                JSON.stringify({
                    versionFile: {
                        path: "./package.json",
                        matcher: '"versionNotFound": "([0-9.]+)"',
                    },
                }),
            );

            Config.getInstance().loadConfigFile();

            await expect(getPackageVersion()).rejects.toThrowError("Cannot find version in version file");
        });
    });

    describe("setPackageVersion", function () {
        it("should set the new version", async () => {
            await setPackageVersion(new Version("0.1.10"));

            const versionFileContent = JSON.parse(fs.readFileSync("package.json").toString());
            expect(versionFileContent.version).toEqual("0.1.10");
        });

        it("should do no changes with dry-run", async () => {
            Config.getInstance().set({ dryRun: true });
            await setPackageVersion(new Version("0.1.10"));

            const versionFileContent = JSON.parse(fs.readFileSync("package.json").toString());
            expect(versionFileContent.version).toEqual("0.1.0");
        });

        it("should throw whether the version file does not exist", async () => {
            await fs.writeFileSync(
                "./.wersionrc.json",
                JSON.stringify({
                    versionFile: {
                        path: "./packageeeeeeee.json",
                        matcher: '"version": "([0-9.]+)"',
                    },
                }),
            );

            Config.getInstance().loadConfigFile();

            await expect(setPackageVersion(new Version("0.1.10"))).rejects.toThrowError(
                "No version file exists in the current directory",
            );
        });
    });
});
