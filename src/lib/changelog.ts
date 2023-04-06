import { getCommitsSinceTag } from "./git";
import { Version } from "./version";
import * as fse from "fs-extra";
import { DefaultLogFields } from "simple-git";
import _ from "lodash";
import { conventionalCommitRegex } from "./util";
import fs from "fs";
import { config } from "./config";

/**
 * Helper interface to pass changelog content info
 */
interface ChangelogContent {
    version: Version;
    features: DefaultLogFields[];
    bugfixes: DefaultLogFields[];
    breakingChanges: DefaultLogFields[];
}

export function getChangelogPath() {
    return config.config.changelogFilePath;
}

/**
 * Create changelog file if not exists
 */
async function createChangelogFileIfNotExists() {
    if (!config.config.dryRun) await fse.ensureFile(getChangelogPath());
}

/**
 * Create changelog and add it to file
 * @param version
 * @param oldVersionTag
 */
export async function generateChangelog(version: Version, oldVersionTag: string) {
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
 * @param markdownToAppend
 */
function updateChangelogFile(markdownToAppend: string) {
    // DryRun
    if (config.config.dryRun) return;

    const currentContentBuffer = fs.readFileSync(getChangelogPath());
    const fileHandle = fs.openSync(getChangelogPath(), "w+"); // Truncate file
    const writeBuffer = Buffer.concat([Buffer.from(markdownToAppend), currentContentBuffer]);

    // Write new content
    fs.writeSync(fileHandle, writeBuffer);
}

function generateChangelogMarkdown(changelogContent: ChangelogContent) {
    const today = new Date();
    const date = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today
        .getDate()
        .toString()
        .padStart(2, "0")}`;

    let markdownToAppend = "";
    markdownToAppend += `# ${changelogContent.version.toString()} (${date})\n`;

    // TODO: Customizable Release Highlights or breaking changes docs

    // Add feature list to changelog
    if (!_.isEmpty(changelogContent.features)) {
        markdownToAppend += `## Features\n`;

        changelogContent.features.forEach(
            (feat) => (markdownToAppend += "- " + conventionalCommitToChangelogString(feat) + "\n"),
        );
    }

    // Add bug fix list to changelog
    if (!_.isEmpty(changelogContent.bugfixes)) {
        markdownToAppend += `## Bug Fixes\n`;

        changelogContent.bugfixes.forEach(
            (fix) => (markdownToAppend += "- " + conventionalCommitToChangelogString(fix) + "\n"),
        );
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
 * @param logFields
 */
function conventionalCommitToChangelogString(logFields: DefaultLogFields): string {
    const matchedConventionalCommit = logFields.message.match(conventionalCommitRegex) as RegExpMatchArray;

    const [, , , scope, message] = matchedConventionalCommit;
    const mdScope = scope ? `__${scope}:__ ` : "";

    // TODO: Link commit with configured repo url
    const commitHashRef = logFields.hash.substring(0, 7);

    // TODO: Extract issue number from commit and add link to it if configured

    return `${mdScope}${message} (${commitHashRef})`;
}

/**
 * Extracts the breaking change info from a commit body
 * @param logFields
 */
function conventionalCommitBreakingChangeToChangelogString(logFields: DefaultLogFields): string {
    const breakingChangesPosition = logFields.body.toLowerCase().search("breaking change");
    let breakingChangesInfo = logFields.body.slice(breakingChangesPosition + 15);

    if (breakingChangesInfo.startsWith(":")) breakingChangesInfo = breakingChangesInfo.slice(1);

    return breakingChangesInfo.trim();
}
