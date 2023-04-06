import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { fs, vol } from "memfs";
import { git } from "../../../src/lib/git";

vi.mock("node:fs", () => ({ default: fs }));
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

vi.mock("inquirer", async () => {
    return {
        default: {
            prompt: vi.fn().mockResolvedValue({
                projectName: "wersion",
                preset: "Node.js",
            }),
        },
    };
});

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

    it("should use the right configuration for default/unrecognized preset", async () => {
        const action = new InitAction();
        const template = action.compileWersionRCTsTemplate({ preset: "C#", projectName: "wersion-test" });
        console.log(template);
        expect(template).toEqual(
            'import { WersionConfigModel, semverMatcher } from "@weichwarenprojekt/wersion";\n' +
                "\n" +
                "  export const configuration: Partial<WersionConfigModel> = {\n" +
                "    versionFile: {\n" +
                '        path: "./package.json",\n' +
                '        matcher: "version": ?"((0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?)",\n' +
                "    },\n" +
                "    commitTypes: {\n" +
                "        major: [],\n" +
                '        minor: ["feat"],\n' +
                '        patch: ["fix"]\n' +
                "    },\n" +
                '    breakingChangeTrigger: "breaking change",\n' +
                '    changelogFilePath: "./CHANGELOG.md",\n' +
                '    projectName: "wersion-test",\n' +
                "  };",
        );
    });

    it("should use the right configuration for Node.js preset", async () => {
        const action = new InitAction();
        const template = action.compileWersionRCTsTemplate({ preset: "Node.js", projectName: "wersion-test" });
        console.log(template);
        expect(template).toEqual(
            'import { WersionConfigModel, semverMatcher } from "@weichwarenprojekt/wersion";\n' +
                "\n" +
                "  export const configuration: Partial<WersionConfigModel> = {\n" +
                "    versionFile: {\n" +
                '        path: "./package.json",\n' +
                '        matcher: "version": ?"((0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?)",\n' +
                "    },\n" +
                "    commitTypes: {\n" +
                "        major: [],\n" +
                '        minor: ["feat"],\n' +
                '        patch: ["fix"]\n' +
                "    },\n" +
                '    breakingChangeTrigger: "breaking change",\n' +
                '    changelogFilePath: "./CHANGELOG.md",\n' +
                '    projectName: "wersion-test",\n' +
                "  };",
        );
    });

    it("should use the right configuration for Flutter preset", async () => {
        const action = new InitAction();
        const template = action.compileWersionRCTsTemplate({ preset: "Flutter", projectName: "wersion-test" });
        console.log(template);
        expect(template).toEqual(
            'import { WersionConfigModel, semverMatcher } from "@weichwarenprojekt/wersion";\n' +
                "\n" +
                "  export const configuration: Partial<WersionConfigModel> = {\n" +
                "    versionFile: {\n" +
                '        path: "./pubspec.yaml",\n' +
                "        matcher: version: ?((0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?),\n" +
                "    },\n" +
                "    commitTypes: {\n" +
                "        major: [],\n" +
                '        minor: ["feat"],\n' +
                '        patch: ["fix"]\n' +
                "    },\n" +
                '    breakingChangeTrigger: "breaking change",\n' +
                '    changelogFilePath: "./CHANGELOG.md",\n' +
                '    projectName: "wersion-test",\n' +
                "  };",
        );
    });
});
