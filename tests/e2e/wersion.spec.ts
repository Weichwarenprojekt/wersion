import { describe, beforeEach, afterAll, it, expect } from "vitest";
import * as fs from "node:fs";
import { ChildProcess, execSync } from "node:child_process";
import * as simpleGit from "simple-git";
import path from "node:path";

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

    afterAll(async () => {
        fs.rmSync("./tests/e2e/checkout", { recursive: true, force: true });
    });

    it("should be a clean git workspace", async () => {
        // If the git workspace is not clean, the e2e will not work
        expect((await git.status()).isClean()).toEqual(true);
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
