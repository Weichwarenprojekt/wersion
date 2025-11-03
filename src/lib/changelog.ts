import { getCommitsSinceTag } from "./git";
import { Version } from "./version";
import * as fse from "fs-extra";
import { DefaultLogFields } from "simple-git";
import _ from "lodash";
import { commitParser, logger } from "./util";
import fs from "fs";
import { config } from "./config";
import path from "node:path";

/**
 * Helper interface to pass changelog content info
 */
interface ChangelogContent {
    version: Version;
    features: DefaultLogFields[];
    bugfixes: DefaultLogFields[];
    breakingChanges: DefaultLogFields[];
}

/**
 * Returns the path to the auto-generated changelog file
 */
export function getChangelogPath() {
    return path.resolve(config.config.changelogFilePath);
}

/**
 * Create changelog file if not exists
 */
async function createChangelogFileIfNotExists() {
    if (!config.config.dryRun) await fse.ensureFile(getChangelogPath());
}

/**
 * Create changelog and add it to file
 */
export async function generateChangelog(version: Version, oldVersionTag: string) {
    logger.info(`generating changelog from ${oldVersionTag}`);
    await createChangelogFileIfNotExists();

    const commits = await getCommitsSinceTag(oldVersionTag);

    const changelogContent: ChangelogContent = { features: [], bugfixes: [], breakingChanges: [], version };
    changelogContent.features = commits.filter((commit) => commit.message.startsWith("feat"));
    changelogContent.bugfixes = commits.filter((commit) => commit.message.startsWith("fix"));
    changelogContent.breakingChanges = commits.filter((commit) =>
        commit.body.toLowerCase().includes(config.config.breakingChangeTrigger),
    );

    const markdown = generateChangelogMarkdown(changelogContent);

    updateChangelogFile(markdown);
}

/**
 * Append new changelog to the beginning of the changelog file
 */
function updateChangelogFile(markdownToAppend: string) {
    // DryRun
    if (config.config.dryRun) return;

    const currentContentBuffer = fs.readFileSync(getChangelogPath());
    const fileHandle = fs.openSync(getChangelogPath(), "w+"); // Truncate file
    const writeBuffer = Buffer.concat([Buffer.from(markdownToAppend), currentContentBuffer]);

    // Write new content
    fs.writeFileSync(fileHandle, writeBuffer);

    fs.closeSync(fileHandle);
}

/**
 * Generates the changelog file
 * @param changelogContent The content containing the changes and the fixes
 */
function generateChangelogMarkdown(changelogContent: ChangelogContent) {
    const today = new Date();
    const date = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today
        .getDate()
        .toString()
        .padStart(2, "0")}`;

    let markdownToAppend = "";
    markdownToAppend += `# ${changelogContent.version.toString()} (${date})\n`;

    // Add feature list to changelog
    if (!_.isEmpty(changelogContent.features)) {
        markdownToAppend += `## Features\n`;

        for (const feat of changelogContent.features) {
            const commitString = conventionalCommitToChangelogString(feat);
            if (_.isNil(commitString)) {
                logger.warn(
                    `The commit ${feat.message} (${feat.hash}) is not in the conventional commit format and therefore skipped in the changelog generation.`,
                );
            } else {
                markdownToAppend += "- " + commitString + "\n";
            }
        }
    }

    // Add bug fix list to changelog
    if (!_.isEmpty(changelogContent.bugfixes)) {
        markdownToAppend += `## Bug Fixes\n`;

        for (const fix of changelogContent.bugfixes) {
            const commitString = conventionalCommitToChangelogString(fix);
            if (_.isNil(commitString)) {
                logger.warn(
                    `The commit '${fix.message}' (${fix.hash}) is not in the conventional commit format and therefore skipped in the changelog generation.`,
                );
            } else {
                markdownToAppend += "- " + commitString + "\n";
            }
        }
    }

    // Add breaking changes list to changelog
    if (!_.isEmpty(changelogContent.breakingChanges)) {
        markdownToAppend += "## BREAKING CHANGES\n";

        changelogContent.breakingChanges.forEach(
            (breakingChange) =>
                (markdownToAppend += "- " + conventionalCommitBreakingChangeToChangelogString(breakingChange)),
        );
    }

    return markdownToAppend;
}

/**
 * Converts a conventional commit in the simple-git format to a changelog line
 */
function conventionalCommitToChangelogString(logFields: DefaultLogFields): string | null {
    const commit = commitParser.parse(logFields.message);
    const mdScope = commit.scope ? `__${commit.scope}:__ ` : "";
    const commitHashRef = logFields.hash.substring(0, 7);
    return `${mdScope}${commit.subject} (${commitHashRef})`;
}

/**
 * Extracts the breaking change info from a commit body
 */
function conventionalCommitBreakingChangeToChangelogString(logFields: DefaultLogFields): string {
    const breakingChangesPosition = logFields.body.toLowerCase().search("breaking change");
    let breakingChangesInfo = logFields.body.slice(breakingChangesPosition + 15);

    if (breakingChangesInfo.startsWith(":")) breakingChangesInfo = breakingChangesInfo.slice(1);

    return breakingChangesInfo.trim();
}
