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

const git = simpleGit.simpleGit({ baseDir: path.join(process.cwd(), "tests/e2e/checkout") });

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
            try {
                const res = execSync("node ../../../../dist/wersion.js", { cwd: "tests/e2e/checkout/server" });
                console.log(res.toString());
            } catch (e) {
                console.log((e as ChildProcess).stdout?.toString());
            }

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
