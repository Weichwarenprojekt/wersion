import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fs, vol } from "memfs";
import { config } from "../../../src/lib/config";
import { BuildNumberAction } from "../../../src/bin/actions/build-number.action";

vi.mock("node:fs", () => ({ default: fs }));

const filesJson = {
    "package.json": JSON.stringify({ name: "wersion-unit-test", version: "0.1.0" }),
    ".wersionrc.ts": `export const configuration = {
        versionFile: {
            path: "./package.json",
        },
        commitTypes: {
            major: [],
            minor: ["feat"],
            patch: ["fix"],
        },
        breakingChangeTrigger: "breaking change",
        changelogFilePath: "./CHANGELOG.md",
    }`,
    "CHANGELOG.md": "",
};

vi.mock("simple-git", () => ({
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    simpleGit: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        commit: vi.fn(),
        log: vi.fn().mockImplementation(() => ({
            total: 1,
        })),
        tag: vi.fn().mockResolvedValue(""),
    })),
}));

describe("default action integration test", () => {
    beforeEach(() => {
        vol.fromJSON(filesJson);
        config.loadConfigFile("./.wersionrc.ts");
        config.set({ dryRun: false, releaseAs: null });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vol.reset();
    });

    it("should add a build number if version is clean", async () => {
        const action = new BuildNumberAction();
        await action.run();

        expect(JSON.parse(fs.readFileSync("./package.json", { encoding: "utf-8" }).toString()).version).toEqual(
            "0.1.0+1",
        );
    });

    it("should increment build number", async () => {
        fs.writeFileSync("./package.json", JSON.stringify({ name: "wersion-unit-test", version: "0.1.0+42" }));
        const action = new BuildNumberAction();
        await action.run();

        expect(JSON.parse(fs.readFileSync("./package.json", { encoding: "utf-8" }).toString()).version).toEqual(
            "0.1.0+43",
        );
    });
});
