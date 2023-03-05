import { fs, vol } from "memfs";
import { generateChangelog } from "../../src/lib/changelog";
import { Version } from "../../src/lib/version";
import * as git from "../../src/lib/git";
import { config } from "../../src/lib/config";

jest.mock("fs", () => ({ ...fs }));
jest.mock("../../src/lib/git");
jest.mock("simple-git", () => ({
    simpleGit: jest.fn(),
}));

const gitMocked = jest.mocked(git);

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
    afterEach(() => {
        vol.reset();
        jest.clearAllMocks();
    });

    describe("generateChangelog", () => {
        it("should generate changelog", async () => {
            vol.fromJSON(files);

            gitMocked.getCommitsSinceTag.mockResolvedValue([
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "feat(): my commit",
                    refs: "sghlgflkd",
                    body: "breaking change",
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
                    "- my commit (dsfjkhs)\n" +
                    "## Bug Fixes\n" +
                    "- remove bug (dsfjkhs)\n" +
                    "## BREAKING CHANGES\n" +
                    "- ",
            );
        });

        it("should not create any file with dry-run", async () => {
            vol.fromJSON(files);

            config.set({ dryRun: true });

            gitMocked.getCommitsSinceTag.mockResolvedValue([
                {
                    hash: "dsfjkhsdkjfhkjl",
                    date: "1.1.1990",
                    message: "feat(): my commit",
                    refs: "sghlgflkd",
                    body: "breaking change",
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
    });
});
