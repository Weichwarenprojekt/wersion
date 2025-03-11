import { vi, describe, it, expect, afterEach, beforeEach } from "vitest";
import { fs, vol } from "memfs";
import { generateChangelog } from "../../src/lib/changelog";
import { Version } from "../../src/lib/version";
import * as git from "../../src/lib/git";
import { config } from "../../src/lib/config";

vi.mock("node:fs", () => ({ default: fs }));
vi.mock("../../src/lib/git");
vi.mock("simple-git", () => ({
    simpleGit: vi.fn(),
}));

const gitMocked = vi.mocked(git);

const files = {
    "CHANGELOG.md": "",
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

describe("changelog test", () => {
    beforeEach(() => {
        vol.fromJSON(files);
        config.loadConfigFile("./.wersionrc.ts");
        config.set({ dryRun: false });
    });

    afterEach(() => {
        vol.reset();
        vi.clearAllMocks();
    });

    describe("generateChangelog", () => {
        it("should generate changelog", async () => {
            gitMocked.getCommitsSinceTag.mockResolvedValue([
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "feat(scope): my commit",
                    refs: "sghlgflkd",
                    body: "breaking change",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
                {
                    hash: "dfsfsdfsf",
                    date: "1.1.1990",
                    message: "feat(): my commit non breaking",
                    refs: "sghlgflkdfd",
                    body: "",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "fix(): remove bug",
                    refs: "sghlgflkd",
                    body: "gg",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
            ]);

            await generateChangelog(new Version("1.0.0"), "0.3.2");

            const today = new Date();
            const date = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today
                .getDate()
                .toString()
                .padStart(2, "0")}`;

            expect(fs.readFileSync("./CHANGELOG.md").toString()).toEqual(
                "# 1.0.0 (" +
                    date +
                    ")\n" +
                    "## Features\n" +
                    "- __scope:__ my commit (dsfjkhs)\n" +
                    "- my commit non breaking (dfsfsdf)\n" +
                    "## Bug Fixes\n" +
                    "- remove bug (dsfjkhs)\n" +
                    "## BREAKING CHANGES\n" +
                    "- ",
            );
        });

        it("should not create any file with dry-run", async () => {
            config.set({ dryRun: true });

            gitMocked.getCommitsSinceTag.mockResolvedValue([
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "feat(): my commit",
                    refs: "sghlgflkd",
                    body: "breaking change: major increase",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "fix(): remove bug",
                    refs: "sghlgflkd",
                    body: "gg",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
            ]);

            await generateChangelog(new Version("1.0.0"), "0.3.2");

            expect(fs.readFileSync("./CHANGELOG.md").toString()).toEqual("");
        });

        it("should skip the non conventional commit", async () => {
            gitMocked.getCommitsSinceTag.mockResolvedValue([
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "non conv: my commit",
                    refs: "sghlgflkd",
                    body: "",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "fix(): remove bug",
                    refs: "sghlgflkd",
                    body: "gg",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "feat(*): add bug",
                    refs: "sghlgflkd",
                    body: "gg",
                    author_name: "John Doe",
                    author_email: "dsjksdfj@sdkfjdsk.com",
                },
            ]);

            await generateChangelog(new Version("1.0.0"), "0.3.2");

            const today = new Date();
            const date = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today
                .getDate()
                .toString()
                .padStart(2, "0")}`;

            expect(fs.readFileSync("./CHANGELOG.md").toString()).toEqual(
                `# 1.0.0 (${date})
## Features
- __*:__ add bug (dsfjkhs)
## Bug Fixes
- remove bug (dsfjkhs)
`,
            );
        });
    });
});
