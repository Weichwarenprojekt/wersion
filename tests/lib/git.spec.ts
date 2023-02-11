import { ReleaseType, Version } from "../../src/models/version";
import {
    createVersionCommit,
    createVersionTag,
    getCommitsSinceTag,
    getReleaseTypeForHistory,
    git,
} from "../../src/lib/git";
import * as fse from "fs-extra";
import { ConfigModel } from "../../src/models/config";

jest.mock("simple-git", () => ({
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
    })),
}));
jest.mock("fs-extra");

const fseMocked = jest.mocked(fse);
const gitMocked = jest.mocked(git);

describe("git test", function () {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createVersionTag", function () {
        it("should add an annotated tag", async () => {
            const res = await createVersionTag(new Version("1.2.3"));

            expect(res).toEqual({ name: "1.2.3" });
        });
    });

    describe("createVersionCommit", function () {
        it("should commit changes", async () => {
            await createVersionCommit(new Version("3.2.1"));

            expect(gitMocked.add.mock.calls.length).toEqual(1);
            expect(gitMocked.commit.mock.calls[0][0]).toEqual("chore: release 3.2.1");
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
    });

    describe("getReleaseTypeForHistory", function () {
        beforeEach(() => {
            fseMocked.readJsonSync.mockReturnValue({
                versionFile: "version.json",
                changelogFilePath: "CHANGELOG.txt",
            } as unknown as ConfigModel);
        });

        it("should throw as no commit was done since last version tag", async () => {
            gitMocked.log = jest.fn().mockImplementation(() => ({
                all: [],
            }));

            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).rejects.toThrowError();
        });

        it("should throw if no conventional commit is found since last version tag", async () => {
            gitMocked.log = jest.fn().mockImplementation(() => ({
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
            }));
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).rejects.toThrowError(
                "no valid commit found since last version",
            );
        });

        it("should return release type major", async () => {
            gitMocked.log = jest.fn().mockImplementation(() => ({
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
            }));
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.major);
        });

        it("should return release type patch", async () => {
            gitMocked.log = jest.fn().mockImplementation(() => ({
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
            }));
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.patch);
        });

        it("should return release type patch (commit without scope)", async () => {
            gitMocked.log = jest.fn().mockImplementation(() => ({
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
            }));
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.patch);
        });

        it("should return release type minor", async () => {
            gitMocked.log = jest.fn().mockImplementation(() => ({
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
            }));
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.minor);
        });

        it("should return release type minor (commit without scope)", async () => {
            gitMocked.log = jest.fn().mockImplementation(() => ({
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
            }));
            await expect(getReleaseTypeForHistory(new Version("5.6.7"))).resolves.toEqual(ReleaseType.minor);
        });
    });
});
