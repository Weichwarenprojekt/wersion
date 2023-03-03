import { fs, vol } from "memfs";
import { Version } from "../../src/lib/version";
jest.mock("fs", () => ({ ...fs }));

import { getPackageVersion, setPackageVersion } from "../../src/lib/version-file";
import { config } from "../../src/lib/config";

const filesJson = {
    "package.json": JSON.stringify({ name: "wersion-unit-test", version: "0.1.0", versionFile: {} }),
    ".wersionrc.ts": `export const configuration = {
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
    }`,
};

describe("version-file test", function () {
    beforeEach(() => {
        vol.fromJSON(filesJson);
        config.loadConfigFile("./.wersionrc.ts");
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
                ".wersionrc.ts",
                `export const configuration = {
                    versionFile: {
                        path: "./packageeeeeeee.json",
                        matcher: '"version": "([0-9.]+)"',
                    },
                }`,
            );

            config.loadConfigFile("./.wersionrc.ts");

            await expect(getPackageVersion()).rejects.toThrowError("No version file exists in the current directory");
        });

        it("should throw whether no version can be found in version file", async () => {
            fs.writeFileSync(
                ".wersionrc.ts",
                `export const configuration = {
                    versionFile: {
                        path: "./package.json",
                        matcher: '"versionNotFound": "([0-9.]+)"',
                    },
                }`,
            );

            config.loadConfigFile("./.wersionrc.ts");

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
            config.set({ dryRun: true });
            await setPackageVersion(new Version("0.1.10"));

            const versionFileContent = JSON.parse(fs.readFileSync("package.json").toString());
            expect(versionFileContent.version).toEqual("0.1.0");
        });

        it("should throw whether the version file does not exist", async () => {
            await fs.writeFileSync(
                "./.wersionrc.ts",
                `export const configuration = {
                    versionFile: {
                        path: "./packageeeeeeee.json",
                        matcher: '"version": "([0-9.]+)"',
                    },
                }`,
            );

            config.loadConfigFile("./.wersionrc.ts");

            await expect(setPackageVersion(new Version("0.1.10"))).rejects.toThrowError(
                "No version file exists in the current directory",
            );
        });
    });
});
