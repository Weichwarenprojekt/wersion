import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fs, vol } from "memfs";

vi.mock("fs", () => ({ ...fs }));
import { git } from "../../../src/lib/git";
import { InitAction } from "../../../src/bin/actions/init.action";
import inquirer from "inquirer";

const filesJson = {
    "package.json": JSON.stringify({ name: "wersion-unit-test", version: "0.1.0" }),
    "CHANGELOG.md": "",
};

const filesWithConfig = {
    ...filesJson,
    ".wersionrc.ts": "existing",
};

vi.mock("simple-git", () => ({
    simpleGit: vi.fn().mockImplementation(() => ({
        addAnnotatedTag: vi.fn((tagName) =>
            Promise.resolve({
                name: tagName,
            }),
        ),
        raw: vi.fn().mockResolvedValue(""),
    })),
}));

vi.mock("inquirer", () => ({
    prompt: vi.fn().mockResolvedValue({
        project_name: "wersion",
        version_file_path: "./package.json",
        version_file_matcher: '"version": ?"([0-9.]+)"',
        changelog_path: "./CHANGELOG.md",
    }),
    ui: {
        BottomBar: vi.fn().mockImplementation(() => ({
            log: { write: vi.fn().mockReturnValue("") },
        })),
    },
}));

const gitMocked = vi.mocked(git);
const inquirerMocked = vi.mocked(inquirer);

describe("init action integration test", () => {
    beforeEach(() => {
        vol.fromJSON(filesJson);
    });

    afterEach(() => {
        vi.clearAllMocks();
        vol.reset();
    });

    it("should create a config and an initial version tag", async () => {
        const action = new InitAction();
        await action.run();

        expect(inquirerMocked.prompt.mock.calls.length).toEqual(1);
        expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(1);
        expect(Object.keys(vol.toJSON()).filter((el) => el.includes(".wersionrc.ts")).length).toEqual(1);
    });

    it("should not create a new config if existing", async () => {
        vol.fromJSON(filesWithConfig);

        const fsSnapshotBefore = vol.toJSON();

        const action = new InitAction();
        await action.run();

        expect(inquirerMocked.prompt.mock.calls.length).toEqual(0);
        expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(1);
        expect(vol.toJSON()).toMatchObject(fsSnapshotBefore);
    });

    it("should not create an initial version tag if there already is one", async () => {
        gitMocked.raw.mockResolvedValue("some value");

        const action = new InitAction();
        await action.run();

        expect(inquirerMocked.prompt.mock.calls.length).toEqual(1);
        expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(0);
        expect(Object.keys(vol.toJSON()).filter((el) => el.includes(".wersionrc.ts")).length).toEqual(1);
    });
});
