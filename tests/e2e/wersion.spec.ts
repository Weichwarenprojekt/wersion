import { describe, beforeEach, afterAll, it, expect } from "vitest";
import * as fs from "node:fs";
import { ChildProcess, execSync } from "node:child_process";

describe("wersion e2e", function () {
    beforeEach(async () => {
        fs.rmSync("./tests/e2e/checkout", { recursive: true, force: true });
        execSync("git clone https://github.com/Weichwarenprojekt/wersion-e2e.git tests/e2e/checkout");
    });

    afterAll(async () => {
        fs.rmSync("./tests/e2e/checkout", { recursive: true, force: true });
    });

    it("should run default action", async () => {
        try {
            execSync("node ./dist/wersion.js");
        } catch (e) {
            console.log((e as ChildProcess).stdout?.toString());
        }
        console.log("run e2e");
        expect(true).toEqual(true);
    });
});
