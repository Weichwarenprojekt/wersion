import simpleGit, { DefaultLogFields } from "simple-git";
import { Version } from "../models/version";

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
export async function getCommitsSinceTag(tag: string) {
    const gitLog = await git.log({ from: tag, to: "HEAD" });
    return gitLog.all.map((logEntry: DefaultLogFields) => logEntry.message);
}
