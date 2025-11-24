import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fs, vol } from "memfs";
import { config } from "../../../src/lib/config";
import { BuildNumberAction } from "../../../src/bin/actions/build-number.action";
import { git } from "../../../src/lib/git";
import { resetMockConfig } from "../../util";
import { execSync } from "node:child_process";

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
    "package-lock.json": "",
};

vi.mock("simple-git", () => ({
    simpleGit: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        commit: vi.fn(),
        log: vi.fn().mockImplementation(() => ({
            total: 1,
        })),
        tag: vi.fn().mockResolvedValue(""),
    })),
}));
vi.mock("node:child_process", () => ({
    execSync: vi.fn(),
}));

const gitMocked = vi.mocked(git);
const execSyncMocked = vi.mocked(execSync);

describe("default action integration test", () => {
    beforeEach(() => {
        vol.fromJSON(filesJson);
        config.loadConfigFile("./.wersionrc.ts");
        config.set({ dryRun: false, releaseAs: null });
    });

    afterEach(() => {
        vi.clearAllMocks();
        vol.reset();
        resetMockConfig();
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

    it("should execute beforeCommit script when configured", async () => {
        const command = "npm run build-number:prepare";
        config.set({ beforeCommit: command });

        const action = new BuildNumberAction();
        await action.run();

        expect(execSyncMocked).toHaveBeenCalledWith(command, { stdio: "inherit" });
    });

    it("should add configured files when incrementing the build number", async () => {
        config.set({ filesToCommit: ["package-lock.json"] });

        const action = new BuildNumberAction();
        await action.run();

        const addCalls = gitMocked.add.mock.calls.map(([arg]) => arg);
        expect(addCalls).toEqual([expect.stringContaining("CHANGELOG.md"), "./package.json", "package-lock.json"]);
    });
});
