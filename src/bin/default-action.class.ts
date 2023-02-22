import { ReleaseType } from "../models/version";
import chalk from "chalk";
import { CliOptions } from "../models/cli-options";
import { createVersionCommit, createVersionTag, getReleaseTypeForHistory, git } from "../lib/git";
import { getPackageVersion, setPackageVersion } from "../lib/version-file";
import { generateChangelog } from "../lib/changelog";
import { ResetMode } from "simple-git";
import inquirer from "inquirer";
import { Config } from "../lib/config.class";

export class DefaultAction {
    async run(cliOptions: CliOptions = {}) {
        Config.getInstance().set(cliOptions);

        const version = await getPackageVersion();

        const oldVersionTag = version.toString();

        let stashRes: string = undefined;

        if ((await git.status()).isClean() && !Config.getInstance().config.dryRun) {
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

            await version.increase(cliOptions.releaseAs ?? releaseType);

            console.log(`release new version ${chalk.cyan(version.toString())}`);

            await setPackageVersion(version);

            await generateChangelog(version, oldVersionTag);

            const createCommitResponse = await createVersionCommit(version);

            console.log(`created release commit ${chalk.cyan(createCommitResponse)}`);

            const tagName = await createVersionTag(version);

            console.log(`created git tag ${chalk.cyan(tagName)}`);
        } finally {
            if (!Config.getInstance().config.dryRun) {
                await git.reset(ResetMode.HARD);
                if (stashRes && !stashRes.startsWith("No local changes to save")) await git.stash(["pop"]);
            }
        }
    }
}
