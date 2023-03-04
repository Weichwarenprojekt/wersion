import * as simpleGit from "simple-git";
import { ReleaseType, Version } from "./version";
import _ from "lodash";
import { conventionalCommitRegex } from "./util";
import { getChangelogPath } from "./changelog";
import { getVersionFile } from "./version-file";
import { config } from "./config";

// Import with * as simpleGit to be able to mock it away
export const git = simpleGit.simpleGit();

function getErrorPrefix() {
    const projectName = config.config.projectName;
    return projectName ? projectName + ": " : "";
}

export function getTagPrefix() {
    const tagPrefix = config.config.projectName;
    return tagPrefix === "" ? "" : tagPrefix + "-";
}

/**
 * Creates a version tag on the current HEAD
 *
 * @param version
 */
export async function createVersionTag(version: Version): Promise<string> {
    // DryRun
    if (config.config.dryRun) return getTagPrefix() + version.toString();

    return (await git.addAnnotatedTag(getTagPrefix() + version.toString(), "")).name;
}

/**
 * Creates a new commit for releasing the new version
 *
 * @param version
 */
export async function createVersionCommit(version: Version) {
    // Add the changelog file as it would be not added when newly created
    if (!config.config.dryRun) {
        await git.add(getChangelogPath());
        await git.add(getVersionFile());
    }

    const commitMessage = `chore: release ${getTagPrefix() + version.toString()}`;

    // DryRun
    if (!config.config.dryRun) await git.commit(commitMessage);

    return commitMessage;
}

/**
 * Gets all commit since the last released version
 *
 * @param tag
 */
export async function getCommitsSinceTag(tag?: string): Promise<simpleGit.DefaultLogFields[]> {
    try {
        const from = tag ?? (await git.raw("rev-list", "--max-parents=0 HEAD"));
        const gitLog = await git.log({ from, to: "HEAD" });
        if (!_.isEmpty(gitLog.all)) return _.clone(gitLog.all) as simpleGit.DefaultLogFields[];
        return [];
    } catch (e) {
        throw new Error(getErrorPrefix() + "Could not ");
    }
}

/**
 * Checks all commits since last version tag and validates the message to
 * determine the new versions release type
 * @param oldVersion
 */
export async function getReleaseTypeForHistory(oldVersion: Version): Promise<ReleaseType> {
    const commits = await getCommitsSinceTag(getTagPrefix() + oldVersion.toString());
    if (commits.length === 0) throw new Error(getErrorPrefix() + "no changes since last version detected");

    const releaseTypeConfig: Record<string, string[]> = config.config.commitTypes;

    // Signal which defines a breaking change
    const breakingChangeTrigger = config.config.breakingChangeTrigger;

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

    throw new Error(getErrorPrefix() + "no changes since last version detected");
}
