import { ReleaseType } from "../../lib/version";
import chalk from "chalk";
import { createVersionCommit, createVersionTag, getReleaseTypeForHistory, getTagPrefix, git } from "../../lib/git";
import { getPackageVersion, setPackageVersion } from "../../lib/version-file";
import { generateChangelog } from "../../lib/changelog";
import { ResetMode } from "simple-git";
import { config } from "../../lib/config";
import { Action } from "./action";
import { logger } from "../../lib/util";
import { confirm } from "@inquirer/prompts";

/**
 * The default action of wersion. It will release a new version depending on the
 * changes that were made since the last release.
 */
export class DefaultAction implements Action {
    /** The name of the action */
    name = "default";
    /** The description of the action */
    description =
        "The action that is executed by default (if wersion is called without a specific action). It will release a new version depending on the changes that were made since the last release.";

    /**
     * Run the action
     */
    async run() {
        const version = await getPackageVersion();
        const oldVersionTag = getTagPrefix() + version.withoutBuildNumber();

        let stashRes = "";

        if (!(await git.status()).isClean() && !config.config.dryRun) {
            const res = await confirm({
                message:
                    "Your project has uncommitted/unstashed changes. Wersion will temporarily stash your changes. Continue?",
            });

            if (!res) return;
            stashRes = await git.stash();
        }

        try {
            const releaseType: ReleaseType = config.config.releaseAs ?? (await getReleaseTypeForHistory(version));

            version.increase(releaseType);

            logger.info(`release new version ${chalk.cyan(version.toString())}`);

            await setPackageVersion(version);

            await generateChangelog(version, oldVersionTag);

            const createCommitResponse = await createVersionCommit(version);

            logger.info(`created release commit ${chalk.cyan(createCommitResponse)}`);

            const tagName = await createVersionTag(version);

            logger.info(`created git tag ${chalk.cyan(tagName)}`);
        } finally {
            if (!config.config.dryRun) {
                await git.reset(ResetMode.HARD);
                if (stashRes && !stashRes.startsWith("No local changes to save")) await git.stash(["pop"]);
            }
        }
    }
}
