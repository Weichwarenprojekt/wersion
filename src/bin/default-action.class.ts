import { ReleaseType } from "../models/version";
import chalk from "chalk";
import { CliOptions } from "../models/cli-options";
import { createVersionCommit, createVersionTag, getReleaseTypeForHistory, git } from "../lib/git";
import { getPackageVersion, setPackageVersion } from "../lib/version-file";
import { generateChangelog } from "../lib/changelog";
import { ResetMode } from "simple-git";

export class DefaultAction {
    async run(cliOptions: CliOptions = {}) {
        const version = await getPackageVersion();

        const oldVersionTag = version.toString();

        const stashRes = await git.stash();

        try {
            const releaseType: ReleaseType = await getReleaseTypeForHistory(version);

            await version.increase(cliOptions.releaseAs ?? releaseType);

            console.log("release new version " + chalk.cyan(version.toString()));

            await setPackageVersion(version);

            await generateChangelog(version, oldVersionTag);

            await createVersionCommit(version);

            console.log("created release commit");

            await createVersionTag(version);

            console.log("created git tag");
        } catch (e) {
            console.log(e);
        } finally {
            await git.reset(ResetMode.HARD);
            if (!stashRes.startsWith("No local changes to save")) await git.stash(["pop"]);
        }
    }
}
