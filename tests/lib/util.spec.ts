import { conventionalCommitRegex } from "../../src/lib/util";

describe("util test", function () {
    describe("test conventional commit regex", function () {
        it("should parse scope and type from valid commit messages", () => {
            expect("feat: a commit".match(conventionalCommitRegex)[1]).toEqual("feat");
            expect("feat(scope): a commit".match(conventionalCommitRegex)[3]).toEqual("scope");
        });

        it("should not parse invalid commit messages", () => {
            expect("feat a commit".match(conventionalCommitRegex)).toEqual(null);
        });
    });
});
