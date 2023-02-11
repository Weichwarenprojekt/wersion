import { ReleaseType } from "../models/version";
import chalk from "chalk";
import { CliOptions } from "../models/cli-options";
import { createVersionCommit, createVersionTag, getReleaseTypeForHistory } from "../lib/git";
import { getPackageVersion, setPackageVersion } from "../lib/version-file";
import { generateChangelog } from "../lib/changelog";

export class DefaultWorkflowClass {
    async run(cliOptions: CliOptions = {}) {
        const version = await getPackageVersion();

        const oldVersionTag = version.toString();

        const releaseType: ReleaseType = await getReleaseTypeForHistory(version);

        await version.increase(cliOptions.releaseAs ?? releaseType);

        console.log("release new version " + chalk.cyan(version.toString()));

        await setPackageVersion(version);

        await generateChangelog(version, oldVersionTag);

        await createVersionCommit(version);

        console.log("created release commit");

        await createVersionTag(version);

        console.log("created git tag");
    }
}
