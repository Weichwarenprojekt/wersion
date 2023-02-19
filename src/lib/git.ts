import * as simpleGit from "simple-git";
import { ReleaseType, Version } from "../models/version";
import * as _ from "lodash";
import { conventionalCommitRegex } from "./util";
import { Config } from "./config.class";
import { getChangelogPath } from "./changelog";
import { getVersionFile } from "./version-file";

// Import with * as simpleGit to be able to mock it away
export const git = simpleGit.simpleGit();

/**
 * Creates a version tag on the current HEAD
 *
 * @param version
 */
export async function createVersionTag(version: Version): Promise<string> {
    return (await git.addAnnotatedTag(version.toString(), "")).name;
}

/**
 * Creates a new commit for releasing the new version
 *
 * @param version
 */
export async function createVersionCommit(version: Version) {
    // Add the changelog file as it would be not added when newly created
    await git.add(getChangelogPath());
    await git.add(getVersionFile());

    return git.commit("chore: release " + version.toString());
}

/**
 * Gets all commit since the last released version
 *
 * @param tag
 */
export async function getCommitsSinceTag(tag?: string): Promise<simpleGit.DefaultLogFields[]> {
    const from = tag ?? (await git.raw("rev-list", "--max-parents=0 HEAD"));
    const gitLog = await git.log({ from, to: "HEAD" });
    if (!_.isEmpty(gitLog.all)) return _.clone(gitLog.all) as simpleGit.DefaultLogFields[];
    return [];
}

/**
 * Checks all commits since last version tag and validates the message to
 * determine the new versions release type
 * @param oldVersion
 */
export async function getReleaseTypeForHistory(oldVersion: Version): Promise<ReleaseType> {
    const commits = await getCommitsSinceTag(oldVersion.toString());
    if (commits.length === 0) throw new Error("no changes since last version detected");

    const releaseTypeConfig: Record<string, string[]> = Config.getInstance().config.commitTypes ?? {
        major: [],
        minor: ["feat"],
        patch: ["fix"],
    };

    // Signal which defines a breaking change
    const breakingChangeTrigger = Config.getInstance().config.breakingChangeTrigger ?? "breaking change";

    // Determine all used commit types and release major if "breaking change" found
    const usedCommitTypes: string[] = [];
    for (const commit of commits) {
        if (commit.body.toLowerCase().includes(breakingChangeTrigger)) {
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
