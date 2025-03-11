import * as simpleGit from "simple-git";
import { ReleaseType, Version } from "./version";
import _ from "lodash";
import { getChangelogPath } from "./changelog";
import { getVersionFile } from "./version-file";
import { config } from "./config";
import * as commitParser from "conventional-commits-parser";

// Import with * as simpleGit to be able to mock it away
export const git = simpleGit.simpleGit({ baseDir: process.cwd() });

/**
 * Returns an error prefix if a project name is set
 */
function getErrorPrefix() {
    const projectName = config.config.projectName;
    return projectName ? projectName + ": " : "";
}

/**
 * Returns a tag prefix if a project name is set
 */
export function getTagPrefix() {
    const tagPrefix = config.config.projectName;
    return tagPrefix ? tagPrefix + "-" : "";
}

/**
 * Check whether there are local commits which weren't pushed to the shared repo, yet.
 */
export async function repoHasLocalCommits(): Promise<boolean> {
    return (await git.log(["origin..HEAD"])).total > 0;
}

/**
 * Creates a version tag on the current HEAD
 */
export async function createVersionTag(version: Version): Promise<string> {
    const tag = getTagPrefix() + version.withoutBuildNumber();
    if (config.config.dryRun) return tag;
    return (await git.addAnnotatedTag(tag, "")).name;
}

/**
 * Checks whether a tag with the given version exists
 */
export async function versionTagExists(version: Version) {
    const tagName = getTagPrefix() + version.withoutBuildNumber();
    const showRefRes = await git.raw(`show-ref`, `--tags`, `${tagName}`);
    return showRefRes !== "";
}

/**
 * Creates a new commit for releasing the new version
 */
export async function createVersionCommit(version: Version) {
    // Add the changelog file as it would be not added when newly created
    if (!config.config.dryRun) {
        await git.add(getChangelogPath());
        await git.add(getVersionFile());
    }

    const commitMessage = `chore: release ${getTagPrefix() + version.toString()}`;

    // DryRun
    if (!config.config.dryRun) await git.commit(commitMessage, { "--no-verify": null });

    return commitMessage;
}

/**
 * Gets all commit since the last released version
 */
export async function getCommitsSinceTag(tag?: string): Promise<simpleGit.DefaultLogFields[]> {
    try {
        const from = tag ?? (await git.raw("rev-list", "--max-parents=0 HEAD"));
        const gitLog = await git.log({ from, to: "HEAD", file: process.cwd() });
        if (!_.isEmpty(gitLog.all)) return _.clone(gitLog.all) as simpleGit.DefaultLogFields[];
        return [];
    } catch (e) {
        throw new Error(`${getErrorPrefix()}Could not get commits since last version!\n\n${e}`);
    }
}

/**
 * Checks all commits since last version tag and validates the message to
 * determine the new versions release type
 */
export async function getReleaseTypeForHistory(oldVersion: Version): Promise<ReleaseType> {
    const commits = await getCommitsSinceTag(getTagPrefix() + oldVersion.withoutBuildNumber());
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
        const result = commitParser.sync(commit.message);
        if (!_.isNull(result)) usedCommitTypes.push(result.type ?? "unknown");
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

/**
 * Returns true if the last commit has a tag
 */
export async function lastCommitHasTag() {
    return (await git.tag({ "--contains": "HEAD" })) !== "";
}
