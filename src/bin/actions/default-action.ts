import { ReleaseType } from "../../lib/version";
import chalk from "chalk";
import { createVersionCommit, createVersionTag, getReleaseTypeForHistory, getTagPrefix, git } from "../../lib/git";
import { getPackageVersion, setPackageVersion } from "../../lib/version-file";
import { generateChangelog } from "../../lib/changelog";
import { ResetMode } from "simple-git";
import inquirer from "inquirer";
import { config } from "../../lib/config";
import { ActionInterface } from "./action.interface";

export class DefaultAction implements ActionInterface {
    async run() {
        const version = await getPackageVersion();

        const oldVersionTag = getTagPrefix() + version.toString();

        let stashRes = "";

        if (!(await git.status()).isClean() && !config.config.dryRun) {
            const res = await inquirer.prompt({
                name: "unstashed_changes",
                type: "confirm",
                message:
                    "Your project has uncommitted/unstashed changes. Wersion will temporarily stash your changes. Continue?",
            });

            if (!res.unstashed_changes) process.exit();
            stashRes = await git.stash();
        }

        try {
            const releaseType: ReleaseType = await getReleaseTypeForHistory(version);

            await version.increase(config.config.releaseAs ?? releaseType);

            console.log(`release new version ${chalk.cyan(version.toString())}`);

            await setPackageVersion(version);

            await generateChangelog(version, oldVersionTag);

            const createCommitResponse = await createVersionCommit(version);

            console.log(`created release commit ${chalk.cyan(createCommitResponse)}`);

            const tagName = await createVersionTag(version);

            console.log(`created git tag ${chalk.cyan(tagName)}`);
        } finally {
            if (!config.config.dryRun) {
                await git.reset(ResetMode.HARD);
                if (stashRes && !stashRes.startsWith("No local changes to save")) await git.stash(["pop"]);
            }
        }
    }
}
