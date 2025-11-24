import { describe, beforeEach, afterAll, it, expect, beforeAll } from "vitest";
import * as fs from "node:fs";
import * as fse from "fs-extra";
import { ChildProcess, execSync } from "node:child_process";
import * as simpleGit from "simple-git";
import path from "node:path";

const today = new Date();
const date = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today
    .getDate()
    .toString()
    .padStart(2, "0")}`;

fse.ensureDirSync("tests/e2e/checkout");

const git = simpleGit.simpleGit({ baseDir: path.join(process.cwd(), "tests/e2e/checkout") });

/**
 * Helper function to get local commits created by the testcases
 */
async function getNewLocalCommits() {
    const history = await git.log(["origin..HEAD"]);
    return history.all;
}

describe("wersion e2e", function () {
    beforeEach(async () => {
        fs.rmSync("./tests/e2e/checkout", { recursive: true, force: true });
        execSync("git clone https://github.com/Weichwarenprojekt/wersion-e2e.git tests/e2e/checkout");
    });

    beforeAll(async () => {
        await fse.emptyDir("./tests/e2e/checkout");

        if (
            !(await git.getConfig("user.name", "global")).value ||
            !(await git.getConfig("user.email", "global")).value
        ) {
            git.addConfig("user.email", "example@example.com", false, "global");
            git.addConfig("user.name", "max", false, "global");
        }
    });

    afterAll(async () => {
        await fse.emptyDir("./tests/e2e/checkout");
    });

    it("should be a clean git workspace", async () => {
        // If the git workspace is not clean, the e2e will not work
        expect((await git.status()).isClean()).toEqual(true);
    });

    describe("testcase/basic", () => {
        beforeEach(async () => {
            await git.raw("switch", "testcase/basic");
        });

        it("should exit with code 1 if nothing happend", async () => {
            let hasThrownExpectedError = false;
            try {
                execSync("node ../../../dist/wersion.js", { cwd: "tests/e2e/checkout" });
            } catch (e) {
                // @ts-expect-error execSync returns status in the case of an error
                hasThrownExpectedError = e?.status === 1;
            }

            expect(hasThrownExpectedError).toEqual(true);
        });

        it("should run default action and increase minor version", async () => {
            fs.writeFileSync("tests/e2e/checkout/test.txt", "placeholder");
            await git.add(".");
            await git.commit("feat: my new feature");

            try {
                const res = execSync("node ../../../dist/wersion.js", { cwd: "tests/e2e/checkout" });
                console.log(res.toString());
            } catch (e) {
                console.log((e as ChildProcess).stdout?.toString());
            }

            expect((await getNewLocalCommits())[0].message).toEqual("chore: release wersion-e2e-1.1.0");
            await expect(git.tag()).resolves.toContain("wersion-e2e-1.1.0");
        });

        it("should run default action show warning for non conventional commit", async () => {
            fs.writeFileSync("tests/e2e/checkout/test.txt", "placeholder");
            await git.add(".");
            await git.commit("feat(scope) my new feature");

            fs.writeFileSync("tests/e2e/checkout/test.txt", "placeholder2");
            await git.add(".");
            await git.commit("fix(scope): correct content");

            try {
                const res = execSync("node ../../../dist/wersion.js", { cwd: "tests/e2e/checkout" });
                console.log(res.toString());
            } catch (e) {
                console.log((e as ChildProcess).stdout?.toString());
            }

            expect((await getNewLocalCommits())[0].message).toEqual("chore: release wersion-e2e-1.0.1");
            await expect(git.tag()).resolves.toContain("wersion-e2e-1.0.1");
        });

        it("should increment build number", async () => {
            fs.writeFileSync("tests/e2e/checkout/test.txt", "placeholder");
            await git.add(".");
            await git.commit("feat: my new feature");

            try {
                const res = execSync("node ../../../dist/wersion.js --incrementBuildNumber", {
                    cwd: "tests/e2e/checkout",
                });
                console.log(res.toString());
            } catch (e) {
                console.log((e as ChildProcess).stdout?.toString());
            }

            expect(fse.readJsonSync("tests/e2e/checkout/package.json").version).toEqual("1.0.0+1");
        });

        it("should releaseAs major even without changes", async () => {
            try {
                const res = execSync("node ../../../dist/wersion.js --releaseAs major", {
                    cwd: "tests/e2e/checkout",
                });
                console.log(res.toString());
            } catch (e) {
                console.log((e as ChildProcess).stdout?.toString());
            }

            expect(fse.readJsonSync("tests/e2e/checkout/package.json").version).toEqual("2.0.0");
        });

        it("should execute beforeCommit script and append configured files to the release commit", async () => {
            const projectRoot = path.join(process.cwd(), "tests/e2e/checkout");
            const configPath = path.join(projectRoot, ".wersionrc.ts");
            const beforeCommitFile = path.join(projectRoot, "before-commit.txt");

            const beforeCommitCommand = `node -e "require('fs').writeFileSync('before-commit.txt','created from beforeCommit')"`;
            const escapedCommand = beforeCommitCommand.replace(/"/g, '\\"');

            const configContent = fs.readFileSync(configPath, "utf-8");
            const updatedConfig = configContent.replace(
                /(\s*changelogFilePath: .*\n)/,
                `  beforeCommit: "${escapedCommand}",\n  filesToCommit: ["before-commit.txt"],\n$1`,
            );
            fs.writeFileSync(configPath, updatedConfig);

            if (fs.existsSync(beforeCommitFile)) fs.rmSync(beforeCommitFile);

            fs.writeFileSync(path.join(projectRoot, "test.txt"), "placeholder");
            await git.add(".");
            await git.commit("feat: my beforeCommit feature");

            execSync("node ../../../dist/wersion.js", { cwd: "tests/e2e/checkout", stdio: "inherit" });

            expect(fs.existsSync(beforeCommitFile)).toEqual(true);

            const committedFilesRaw = await git.raw(["show", "--pretty=format:", "--name-only", "HEAD"]);
            const committedFiles = committedFilesRaw
                .split("\n")
                .map((line) => line.trim())
                .filter((line) => line.length > 0);

            expect(committedFiles).toContain("before-commit.txt");
        });
    });

    describe("testcase/monorepo", () => {
        beforeEach(async () => {
            await git.raw("switch", "testcase/monorepo");
        });

        it("should run default action and increase minor version", async () => {
            fs.writeFileSync("tests/e2e/checkout/client/test.txt", "placeholder");
            await git.add(".");
            await git.commit("feat: my new client feature");

            fs.writeFileSync("tests/e2e/checkout/server/test.txt", "placeholder");
            await git.add(".");
            await git.commit("feat: my new server feature");

            // Release server
            execSync("node ../../../../dist/wersion.js", { cwd: "tests/e2e/checkout/server", stdio: "inherit" });

            expect((await getNewLocalCommits())[0].message).toEqual("chore: release server-2.1.0");
            await expect(git.tag()).resolves.toContain("server-2.1.0");

            const shortHashServer = (await getNewLocalCommits())[1].hash.substring(0, 7);

            expect(fse.readFileSync("tests/e2e/checkout/server/CHANGELOG.md").toString()).toEqual(
                `# 2.1.0 (${date})\n## Features\n- my new server feature (${shortHashServer})\n`,
            );

            // Release client
            try {
                const res = execSync("node ../../../../dist/wersion.js", { cwd: "tests/e2e/checkout/client" });
                console.log(res.toString());
            } catch (e) {
                console.log((e as ChildProcess).stdout?.toString());
            }

            expect((await getNewLocalCommits())[0].message).toEqual("chore: release client-3.1.0");
            await expect(git.tag()).resolves.toContain("client-3.1.0");

            const shortHashClient = (await getNewLocalCommits())[3].hash.substring(0, 7);

            expect(fse.readFileSync("tests/e2e/checkout/client/CHANGELOG.md").toString()).toEqual(
                `# 3.1.0 (${date})\n## Features\n- my new client feature (${shortHashClient})\n`,
            );
        });
    });
});
