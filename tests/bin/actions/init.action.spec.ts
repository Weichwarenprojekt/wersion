import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fs, vol } from "memfs";
import { git } from "../../../src/lib/git";
import { InitAction, NodeJSPresets, Presets } from "../../../src/bin/actions/init.action";
import * as inquirer from "@inquirer/prompts";
import { getMockFile, resetMockConfig } from "../../util";

vi.mock("node:fs", () => ({ default: fs }));

const filesJson = {
    "package.json": JSON.stringify({ name: "wersion-unit-test", version: "0.1.0" }),
    "pubspec.yaml": "version: 0.1.0",
    "CHANGELOG.md": "",
};

const filesWithConfig = {
    ...filesJson,
    ".wersionrc.ts": "export const configuration = {};",
};

vi.mock("simple-git", () => ({
    simpleGit: vi.fn().mockImplementation(() => ({
        addAnnotatedTag: vi.fn((tagName) =>
            Promise.resolve({
                name: tagName,
            }),
        ),
        raw: vi.fn().mockResolvedValue(""),
        add: vi.fn(),
    })),
}));

vi.mock("@inquirer/prompts", () => ({
    input: vi.fn().mockResolvedValue("wersion"),
    select: vi.fn().mockResolvedValue("nodejs"),
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
        resetMockConfig();
    });

    it("should create a config and an initial version tag", async () => {
        const action = new InitAction();
        await action.run();

        expect(inquirerMocked.input.mock.calls.length).toEqual(1);
        expect(inquirerMocked.select.mock.calls.length).toEqual(2);
        expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(1);
        expect(Object.keys(vol.toJSON()).filter((el) => el.includes(".wersionrc.ts")).length).toEqual(1);
    });

    it("should ignore build number for initial tag", async () => {
        vol.fromJSON({
            "package.json": JSON.stringify({ name: "wersion-unit-test", version: "0.1.0+1" }),
            "CHANGELOG.md": "",
        });
        const action = new InitAction();
        await action.run();

        expect(inquirerMocked.input.mock.calls.length).toEqual(1);
        expect(inquirerMocked.select.mock.calls.length).toEqual(2);
        expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(1);
        expect(gitMocked.addAnnotatedTag).toHaveBeenCalledWith("wersion-0.1.0", "");
        expect(Object.keys(vol.toJSON()).filter((el) => el.includes(".wersionrc.ts")).length).toEqual(1);
    });

    it("should not create a new config if existing", async () => {
        vol.fromJSON(filesWithConfig);

        const fsSnapshotBefore = vol.toJSON();

        const action = new InitAction();
        await action.run();

        expect(inquirerMocked.input.mock.calls.length).toEqual(0);
        expect(inquirerMocked.select.mock.calls.length).toEqual(0);
        expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(0);
        expect(vol.toJSON()).toMatchObject(fsSnapshotBefore);
    });

    it("should not create an initial version tag if there already is one", async () => {
        gitMocked.raw.mockResolvedValue("some value");

        const action = new InitAction();
        await action.run();

        expect(inquirerMocked.input.mock.calls.length).toEqual(1);
        expect(inquirerMocked.select.mock.calls.length).toEqual(2);
        expect(gitMocked.addAnnotatedTag.mock.calls.length).toEqual(0);
        expect(Object.keys(vol.toJSON()).filter((el) => el.includes(".wersionrc.ts")).length).toEqual(1);
    });

    it("should use the right configuration for default/unrecognized preset", async () => {
        const action = new InitAction();
        vi.spyOn(inquirer, "select").mockResolvedValueOnce("c#");
        vi.spyOn(inquirer, "input").mockResolvedValueOnce("wersion-test");
        await action.run();
        expect(getMockFile(vol, ".wersionrc.ts")).toEqual(
            'import { WersionConfigModel } from "@weichwarenprojekt/wersion";\n' +
                "\n" +
                "export const configuration: Partial<WersionConfigModel> = {\n" +
                "  versionFile: {\n" +
                "      path: `./package.json`,\n" +
                '      matcher: `"version": *"{{semverMatcher}}"`\n' +
                "  },\n" +
                "  commitTypes: {\n" +
                "      major: [],\n" +
                '      minor: ["feat"],\n' +
                '      patch: ["fix"]\n' +
                "  },\n" +
                '  breakingChangeTrigger: "breaking change",\n' +
                '  changelogFilePath: "./CHANGELOG.md",\n' +
                '  projectName: "wersion-test"\n' +
                "};",
        );
    });

    it("should use the right configuration for custom preset", async () => {
        const action = new InitAction();
        vi.spyOn(inquirer, "select").mockResolvedValueOnce(Presets.custom);
        vi.spyOn(inquirer, "input").mockResolvedValueOnce("wersion-test");
        await action.run();
        expect(getMockFile(vol, ".wersionrc.ts")).toEqual(
            'import { WersionConfigModel } from "@weichwarenprojekt/wersion";\n' +
                "\n" +
                "export const configuration: Partial<WersionConfigModel> = {\n" +
                "  versionFile: {\n" +
                "      path: `<enter file>`,\n" +
                '      matcher: `"version": *"{{semverMatcher}}"`\n' +
                "  },\n" +
                "  commitTypes: {\n" +
                "      major: [],\n" +
                '      minor: ["feat"],\n' +
                '      patch: ["fix"]\n' +
                "  },\n" +
                '  breakingChangeTrigger: "breaking change",\n' +
                '  changelogFilePath: "./CHANGELOG.md",\n' +
                '  projectName: "wersion-test"\n' +
                "};",
        );
    });

    it("should use the right configuration for Node.js preset", async () => {
        const action = new InitAction();
        vi.spyOn(inquirer, "select").mockResolvedValueOnce(Presets.nodejs);
        vi.spyOn(inquirer, "select").mockResolvedValueOnce(NodeJSPresets.npm);
        vi.spyOn(inquirer, "input").mockResolvedValueOnce("wersion-test");
        await action.run();
        expect(getMockFile(vol, ".wersionrc.ts")).toEqual(
            'import { WersionConfigModel } from "@weichwarenprojekt/wersion";\n' +
                "\n" +
                "export const configuration: Partial<WersionConfigModel> = {\n" +
                "  versionFile: {\n" +
                "      path: `./package.json`,\n" +
                '      matcher: `"version": *"{{semverMatcher}}"`\n' +
                "  },\n" +
                "  commitTypes: {\n" +
                "      major: [],\n" +
                '      minor: ["feat"],\n' +
                '      patch: ["fix"]\n' +
                "  },\n" +
                '  beforeCommit: "npm i",\n' +
                '  filesToCommit: ["package-lock.json"],\n' +
                '  breakingChangeTrigger: "breaking change",\n' +
                '  changelogFilePath: "./CHANGELOG.md",\n' +
                '  projectName: "wersion-test"\n' +
                "};",
        );
    });

    it("should use the right configuration for Flutter preset", async () => {
        const action = new InitAction();
        vi.spyOn(inquirer, "select").mockResolvedValueOnce(Presets.flutter);
        vi.spyOn(inquirer, "input").mockResolvedValueOnce("wersion-test");
        await action.run();
        expect(getMockFile(vol, ".wersionrc.ts")).toEqual(
            'import { WersionConfigModel } from "@weichwarenprojekt/wersion";\n' +
                "\n" +
                "export const configuration: Partial<WersionConfigModel> = {\n" +
                "  versionFile: {\n" +
                "      path: `./pubspec.yaml`,\n" +
                "      matcher: `version: *{{semverMatcher}}`\n" +
                "  },\n" +
                "  commitTypes: {\n" +
                "      major: [],\n" +
                '      minor: ["feat"],\n' +
                '      patch: ["fix"]\n' +
                "  },\n" +
                '  breakingChangeTrigger: "breaking change",\n' +
                '  changelogFilePath: "./CHANGELOG.md",\n' +
                '  projectName: "wersion-test"\n' +
                "};",
        );
    });
});
