import { fs, vol } from "memfs";
import { config } from "../../../src/lib/config";
import { DefaultAction } from "../../../src/bin/actions/default.action";
import { git } from "../../../src/lib/git";
import { ReleaseType } from "../../../src/lib/version";

jest.mock("fs", () => ({ ...fs }));

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
    "CHANGELOG.md": "",
};

enum ResetMode {
    MIXED = "mixed",
    SOFT = "soft",
    HARD = "hard",
    MERGE = "merge",
    KEEP = "keep",
}

jest.mock("simple-git", () => ({
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    ResetMode: jest.fn().mockReturnValue(ResetMode),
    simpleGit: jest.fn().mockImplementation(() => ({
        addAnnotatedTag: jest.fn((tagName) =>
            Promise.resolve({
                name: tagName,
            }),
        ),
        add: jest.fn(),
        commit: jest.fn(),
        raw: jest.fn().mockResolvedValue("flkjhsfjlksdhjfhsdjfh"),
        log: jest.fn().mockImplementation(() => ({
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
        status: jest.fn().mockResolvedValue({ isClean: () => true }),
        reset: jest.fn(),
        stash: jest.fn().mockResolvedValue("dfdf"),
    })),
}));

jest.mock("inquirer", () => ({
    prompt: jest.fn().mockResolvedValue({ unstashed_changes: true }),
    ui: {
        BottomBar: jest.fn().mockImplementation(() => ({
            log: { write: jest.fn().mockReturnValue("") },
        })),
    },
}));

const gitMocked = jest.mocked(git);

describe("default action integration test", () => {
    beforeEach(() => {
        vol.fromJSON(filesJson);
        config.loadConfigFile("./.wersionrc.ts");
        config.set({ dryRun: false, releaseAs: null });
    });

    afterEach(() => {
        jest.clearAllMocks();
        vol.reset();
    });

    it("should run default action with default parameters", async () => {
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
            gitMocked.status = jest.fn().mockResolvedValue({ isClean: () => false });
            const action = new DefaultAction();
            await action.run();

            expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 1.0.0");
            expect(gitMocked.addAnnotatedTag.mock.calls[0][0]).toEqual("1.0.0");
            expect(gitMocked.stash.mock.calls.length).toEqual(2);
            expect(gitMocked.reset.mock.calls.length).toEqual(1);
        });

        it("should run with dry run and do not affect anything with uncommitted changes", async () => {
            gitMocked.status = jest.fn().mockResolvedValue({ isClean: () => false });
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
    });
});
