import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { ReleaseType, Version } from "../../src/lib/version";
import {
    lastCommitHasTag,
    createVersionCommit,
    createVersionTag,
    getCommitsSinceTag,
    getReleaseTypeForHistory,
    git,
    repoHasLocalCommits,
    versionTagExists,
    addFilesToCommit,
    executeBeforeCommitScript,
} from "../../src/lib/git";
import * as fse from "fs-extra";
import { WersionConfigModel } from "../../src/models/wersion-config.model";
import { config } from "../../src/lib/config";
import { LogResult } from "simple-git";
import { resetMockConfig } from "../util";
import { execSync } from "node:child_process";
import fs from "node:fs";

vi.mock("simple-git", () => ({
    simpleGit: vi.fn().mockImplementation(() => ({
        addAnnotatedTag: vi.fn((tagName) =>
            Promise.resolve({
                name: tagName,
            }),
        ),
        add: vi.fn(),
        commit: vi.fn(),
        tag: vi.fn(),
        raw: vi.fn().mockResolvedValue("flkjhsfjlksdhjfhsdjfh"),
        log: vi.fn().mockImplementation(() => ({
            all: [
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "feat(): my commit",
                    refs: "sghlgflkd",
                    body: "breaking change",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
            ],
        })),
    })),
}));
vi.mock("fs-extra");
vi.mock("node:child_process", () => ({
    execSync: vi.fn(),
}));

const fseMocked = vi.mocked(fse);
const gitMocked = vi.mocked(git);
const execSyncMocked = vi.mocked(execSync);

describe("git test", function () {
    beforeEach(() => {
        config.set({ projectName: "testing" });
    });

    afterEach(() => {
        vi.clearAllMocks();
        resetMockConfig();
    });

    describe("createVersionTag", function () {
        it("should add an annotated tag", async () => {
            const res = await createVersionTag(new Version("1.2.3"));

            expect(res).toEqual("testing-1.2.3");
        });

        it("should create no tag with dry-run", async () => {
            config.set({ dryRun: true });
            const res = await createVersionTag(new Version("1.2.3"));

            expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(0);
            expect(res).toEqual("testing-1.2.3");
        });
    });

    describe("version tag exists", () => {
        it("should return true if tag exists", async () => {
            gitMocked.raw.mockResolvedValue("fdfd");

            const res = await versionTagExists(new Version("1.1.1"));

            expect(res).toEqual(true);
        });

        it("should return false if tag does not exists", async () => {
            gitMocked.raw.mockResolvedValue("");

            const res = await versionTagExists(new Version("1.1.1"));

            expect(res).toEqual(false);
        });
    });

    describe("createVersionCommit", function () {
        it("should commit changes", async () => {
            await createVersionCommit(new Version("3.2.1"));

            expect(gitMocked.add.mock.calls.length).toEqual(2);
            expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release testing-3.2.1");
        });

        it("should create no commit with dry-run", async () => {
            config.set({ dryRun: true });
            await createVersionCommit(new Version("3.2.1"));

            expect(gitMocked.add.mock.calls.length).toEqual(0);
            expect(gitMocked.commit.mock.calls.length).toEqual(0);
        });
    });

    describe("executeBeforeCommitScript", () => {
        it("should execute configured script before committing", () => {
            config.set({ beforeCommit: "npm run build" });

            executeBeforeCommitScript();

            expect(execSyncMocked).toHaveBeenCalledWith("npm run build", { stdio: "inherit" });
        });

        it("should skip execution when command is empty", () => {
            config.set({ beforeCommit: "   " });

            executeBeforeCommitScript();

            expect(execSyncMocked).not.toHaveBeenCalled();
        });

        it("should skip execution when in dry run mode", () => {
            config.set({ beforeCommit: "npm run build", dryRun: true });

            executeBeforeCommitScript();

            expect(execSyncMocked).not.toHaveBeenCalled();
        });
    });

    describe("addFilesToCommit", () => {
        it("should add default and configured files", async () => {
            const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
            config.set({ filesToCommit: ["package-lock.json", "pnpm-lock.yaml"] });

            await addFilesToCommit();

            const addCalls = gitMocked.add.mock.calls.map(([arg]) => arg);
            expect(addCalls).toEqual([
                expect.stringContaining("CHANGELOG.md"),
                "./package.json",
                "package-lock.json",
                "pnpm-lock.yaml",
            ]);
            existsSyncSpy.mockRestore();
        });

        it("should skip when running in dry run mode", async () => {
            const existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
            config.set({ dryRun: true, filesToCommit: ["package-lock.json"] });

            await addFilesToCommit();

            expect(gitMocked.add).not.toHaveBeenCalled();
            existsSyncSpy.mockRestore();
        });
    });

    describe("getCommitsSinceTag", function () {
        it("should return all commits by given tag", async () => {
            const res = await getCommitsSinceTag("0.0.1");

            expect(gitMocked.raw.mock.calls.length).toEqual(0);

            expect(res.length).toEqual(1);
            expect(res[0].author_name).toEqual("John Doe");
        });

        it("should return all commits without given tag", async () => {
            const res = await getCommitsSinceTag();

            expect(gitMocked.raw.mock.calls.length).toEqual(1);

            expect(res.length).toEqual(1);
            expect(res[0].author_name).toEqual("John Doe");
        });

        it("should throw on error", async () => {
            gitMocked.raw.mockRejectedValue("");

            await expect(getCommitsSinceTag()).rejects.toThrowError(
                "testing: Could not get commits since last version!",
            );
        });

        it("should throw on error but without project prefix", async () => {
            gitMocked.raw.mockRejectedValue("");
            config.set({ projectName: "" });

            await expect(getCommitsSinceTag()).rejects.toThrowError("Could not get commits since last version!");
        });
    });

    describe("getReleaseTypeForHistory", function () {
        beforeEach(() => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            fseMocked.default.readJsonSync.mockReturnValue({
                versionFile: "version.json",
                changelogFilePath: "CHANGELOG.txt",
            } as unknown as WersionConfigModel);
        });

        it("should throw as no commit was done since last version tag", async () => {
            gitMocked.log.mockResolvedValue({
                all: [],
            } as unknown as LogResult);

            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).rejects.toThrowError();
        });

        it("should throw if no conventional commit is found since last version tag", async () => {
            gitMocked.log.mockResolvedValue({
                all: [
                    {
                        hash: "dsfjkhsdkjfhkjl",
                        date: "1.1.1990",
                        message: "my unconventional commit",
                        refs: "sghlgflkd",
                        body: "body",
                        author_name: "John Doe",
                        author_email: "dsjksdfj@sdkfjdsk.com",
                    },
                ],
            } as unknown as LogResult);
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).rejects.toThrowError();
        });

        it("should return release type major", async () => {
            gitMocked.log.mockResolvedValue({
                all: [
                    {
                        hash: "dsfjkhsdkjfhkjl",
                        date: "1.1.1990",
                        message: "feat(): my commit",
                        refs: "sghlgflkd",
                        body: "breaking change",
                        author_name: "John Doe",
                        author_email: "dsjksdfj@sdkfjdsk.com",
                    },
                ],
            } as unknown as LogResult);
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.major);
        });

        it("should return release type patch", async () => {
            gitMocked.log.mockResolvedValue({
                all: [
                    {
                        hash: "dsfjkhsdkjfhkjl",
                        date: "1.1.1990",
                        message: "fix(): my commit",
                        refs: "sghlgflkd",
                        body: "sdjfhsdjkf",
                        author_name: "John Doe",
                        author_email: "dsjksdfj@sdkfjdsk.com",
                    },
                ],
            } as unknown as LogResult);
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.patch);
        });

        it("should return release type patch (commit without scope)", async () => {
            gitMocked.log.mockResolvedValue({
                all: [
                    {
                        hash: "dsfjkhsdkjfhkjl",
                        date: "1.1.1990",
                        message: "fix: my commit",
                        refs: "sghlgflkd",
                        body: "sdjfhsdjkf",
                        author_name: "John Doe",
                        author_email: "dsjksdfj@sdkfjdsk.com",
                    },
                ],
            } as unknown as LogResult);
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.patch);
        });

        it("should return release type minor", async () => {
            gitMocked.log.mockResolvedValue({
                all: [
                    {
                        hash: "dsfjkhsdkjfhkjl",
                        date: "1.1.1990",
                        message: "feat(): my commit",
                        refs: "sghlgflkd",
                        body: "sdjfhsdjkf",
                        author_name: "John Doe",
                        author_email: "dsjksdfj@sdkfjdsk.com",
                    },
                ],
            } as unknown as LogResult);
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.minor);
        });

        it("should return release type minor (commit without scope)", async () => {
            gitMocked.log.mockResolvedValue({
                all: [
                    {
                        hash: "dsfjkhsdkjfhkjl",
                        date: "1.1.1990",
                        message: "feat: my commit",
                        refs: "sghlgflkd",
                        body: "sdjfhsdjkf",
                        author_name: "John Doe",
                        author_email: "dsjksdfj@sdkfjdsk.com",
                    },
                ],
            } as unknown as LogResult);
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.minor);
        });
    });

    describe("repoHasLocalCommits", function () {
        it("should return true", async () => {
            gitMocked.log.mockResolvedValue({ total: 1 } as LogResult);
            await expect(repoHasLocalCommits()).resolves.toEqual(true);
        });

        it("should return false", async () => {
            gitMocked.log.mockResolvedValue({ total: 0 } as LogResult);
            await expect(repoHasLocalCommits()).resolves.toEqual(false);
        });
    });

    describe("commitHasTag", function () {
        it("should return true", async () => {
            gitMocked.tag.mockResolvedValue("mytag");
            await expect(lastCommitHasTag()).resolves.toEqual(true);
        });

        it("should return false", async () => {
            gitMocked.tag.mockResolvedValue("");
            await expect(lastCommitHasTag()).resolves.toEqual(false);
        });
    });
});
