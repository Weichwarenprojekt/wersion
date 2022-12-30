import simpleGit, { DefaultLogFields } from "simple-git";
import { ReleaseType, Version } from "../models/version";
import * as _ from "lodash";
import { conventionalCommitRegex } from "./util";

const git = simpleGit();

/**
 * Creates a version tag on the current HEAD
 *
 * @param version
 */
export async function createVersionTag(version: Version) {
    return git.addAnnotatedTag(version.toString(), "");
}

/**
 * Creates a new commit for releasing the new version
 *
 * @param version
 */
export async function createVersionCommit(version: Version) {
    // TODO: Config with string interpolation
    return git.commit("chore: release " + version.toString());
}

/**
 * Gets all commit since the last released version
 *
 * @param tag
 */
export async function getCommitsSinceTag(tag: string): Promise<DefaultLogFields[]> {
    const from = tag ?? (await git.raw("rev-list", "--max-parents=0 HEAD"));
    const gitLog = await git.log({ from, to: "HEAD" });
    if (!_.isEmpty(gitLog.all)) return _.clone(gitLog.all) as DefaultLogFields[];
}

/**
 * Checks all commits since last version tag and validates the message to
 * determine the new versions release type
 * @param oldVersion
 */
export async function getReleaseTypeForHistory(oldVersion: Version): Promise<ReleaseType> {
    const commits = await getCommitsSinceTag(oldVersion.toString());
    if (commits.length === 0) throw new Error("no changes since last version detected");

    const releaseTypeConfig: Record<string, string[]> = {
        major: [],
        minor: ["feat"],
        patch: ["fix", "chore", "refactor"],
    };

    // Determine all used commit types and release major if "breaking change" found
    const usedCommitTypes: string[] = [];
    for (const commit of commits) {
        if (commit.body.toLowerCase().includes("breaking change")) {
            return ReleaseType.major;
        }
        const result = commit.message.match(conventionalCommitRegex);
        if (!_.isNull(result)) usedCommitTypes.push(result[1]); // First capturing group
    }

    // Exit with minor type if commit type matches
    for (const type of usedCommitTypes) {
        if (releaseTypeConfig.minor.includes(type)) return ReleaseType.minor;
    }

    // Exit with patch type if commit type matches
    for (const type of usedCommitTypes) {
        if (releaseTypeConfig.patch.includes(type)) return ReleaseType.patch;
    }

    throw new Error("no valid commit found since last version");
}
