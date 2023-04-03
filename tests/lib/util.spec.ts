import { describe, it, expect } from "vitest";
import { conventionalCommitRegex } from "../../src/lib/util";

describe("util test", function () {
    describe("test conventional commit regex", function () {
        it("should parse scope and type from valid commit messages", () => {
            const commit1 = "feat: a commit".match(conventionalCommitRegex) ?? [];
            const commit2 = "feat(scope): a commit".match(conventionalCommitRegex) ?? [];
            expect(commit1[1]).toEqual("feat");
            expect(commit2[3]).toEqual("scope");
        });

        it("should not parse invalid commit messages", () => {
            expect("feat a commit".match(conventionalCommitRegex)).toEqual(null);
        });
    });
});
