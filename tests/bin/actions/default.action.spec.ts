import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fs, vol } from "memfs";
import { config } from "../../../src/lib/config";
import { DefaultAction } from "../../../src/bin/actions/default.action";
import { git } from "../../../src/lib/git";
import { ReleaseType } from "../../../src/lib/version";
import inquirer from "inquirer";
import { StatusResult } from "simple-git";

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

enum ResetMode {
    MIXED = "mixed",
    SOFT = "soft",
    HARD = "hard",
    MERGE = "merge",
    KEEP = "keep",
}

vi.mock("simple-git", () => ({
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ResetMode: vi.fn().mockReturnValue(ResetMode),
    simpleGit: vi.fn().mockImplementation(() => ({
        addAnnotatedTag: vi.fn((tagName) =>
            Promise.resolve({
                name: tagName,
            }),
        ),
        add: vi.fn(),
        commit: vi.fn(),
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
        status: vi.fn().mockResolvedValue({ isClean: () => true }),
        reset: vi.fn(),
        stash: vi.fn().mockResolvedValue("dfdf"),
    })),
}));

vi.mock("inquirer", () => ({
    default: {
        prompt: vi.fn().mockResolvedValue({ unstashed_changes: true }),
        ui: {
            BottomBar: vi.fn().mockImplementation(() => ({
                log: { write: vi.fn().mockReturnValue("") },
            })),
        },
    },
}));

const gitMocked = vi.mocked(git);
const inquirerMocked = vi.mocked(inquirer);

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

    it("should run default action with default parameters", async () => {
        const action = new DefaultAction();
        await action.run();

        expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 1.0.0");
        expect(gitMocked.addAnnotatedTag.mock.calls[0][0]).toEqual("1.0.0");
    });

    it("should ignore build number running the default action", async () => {
        vol.fromJSON({
            ...filesJson,
            "package.json": JSON.stringify({ name: "wersion-unit-test", version: "0.1.0+23" }),
        });
        const action = new DefaultAction();
        await action.run();

        expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 1.0.0");
        expect(gitMocked.addAnnotatedTag.mock.calls[0][0]).toEqual("1.0.0");
    });

    it("should run with dry run and do not affect anything", async () => {
        config.set({ dryRun: true });
        const fsSnapshotBefore = vol.toJSON();

        const action = new DefaultAction();
        await action.run();

        const gitDryRunWhitelist = ["status", "log"];

        for (const method of Object.keys(gitMocked).filter((el) => !gitDryRunWhitelist.includes(el))) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(gitMocked[method].mock.calls.length).toEqual(0);
        }

        const fsSnapshotAfter = vol.toJSON();
        expect(fsSnapshotAfter).toMatchObject(fsSnapshotBefore);
    });

    describe("releaseAs", () => {
        it("should release as major", async () => {
            config.set({ releaseAs: ReleaseType.major });
            const action = new DefaultAction();
            await action.run();

            expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 1.0.0");
            expect(gitMocked.addAnnotatedTag.mock.calls[0][0]).toEqual("1.0.0");
        });

        it("should release as minor", async () => {
            config.set({ releaseAs: ReleaseType.minor });
            const action = new DefaultAction();
            await action.run();

            expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 0.2.0");
            expect(gitMocked.addAnnotatedTag.mock.calls[0][0]).toEqual("0.2.0");
        });

        it("should release as patch", async () => {
            config.set({ releaseAs: ReleaseType.patch });
            const action = new DefaultAction();
            await action.run();

            expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 0.1.1");
            expect(gitMocked.addAnnotatedTag.mock.calls[0][0]).toEqual("0.1.1");
        });
    });

    describe("stashing", () => {
        it("should stash uncommitted changes", async () => {
            gitMocked.status.mockResolvedValue({ isClean: () => false } as StatusResult);
            const action = new DefaultAction();
            await action.run();

            expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 1.0.0");
            expect(gitMocked.addAnnotatedTag.mock.calls[0][0]).toEqual("1.0.0");
            expect(gitMocked.stash.mock.calls.length).toEqual(2);
            expect(gitMocked.reset.mock.calls.length).toEqual(1);
        });

        it("should run with dry run and do not affect anything with uncommitted changes", async () => {
            gitMocked.status.mockResolvedValue({ isClean: () => false } as StatusResult);
            config.set({ dryRun: true });
            const fsSnapshotBefore = vol.toJSON();

            const action = new DefaultAction();
            await action.run();

            const gitDryRunWhitelist = ["status", "log"];

            for (const method of Object.keys(gitMocked).filter((el) => !gitDryRunWhitelist.includes(el))) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                expect(gitMocked[method].mock.calls.length).toEqual(0);
            }

            const fsSnapshotAfter = vol.toJSON();
            expect(fsSnapshotAfter).toMatchObject(fsSnapshotBefore);
        });

        it("should abort if there are unstashed changes and user does not approve", async () => {
            gitMocked.status.mockResolvedValue({ isClean: () => false } as StatusResult);
            inquirerMocked.prompt.mockResolvedValue({ unstashed_changes: false });
            const fsSnapshotBefore = vol.toJSON();

            const action = new DefaultAction();
            await action.run();

            const fsSnapshotAfter = vol.toJSON();
            expect(fsSnapshotAfter).toMatchObject(fsSnapshotBefore);
        });
    });
});
