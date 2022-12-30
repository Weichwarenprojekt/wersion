import { getPackageVersion, setPackageVersion } from "../lib/version-file";
import { ReleaseType } from "../models/version";
import { createVersionCommit, createVersionTag, getReleaseTypeForHistory } from "../lib/git";
import chalk from "chalk";
import { generateChangelog } from "../lib/changelog";

export class DefaultWorkflowClass {
    async run() {
        const version = await getPackageVersion();

        const oldVersionTag = version.toString();

        const releaseType: ReleaseType = await getReleaseTypeForHistory(version);

        await version.increase(releaseType);

        console.log("release new version " + chalk.cyan(version.toString()));

        await setPackageVersion(version);

        await generateChangelog(version, oldVersionTag);

        await createVersionCommit(version);

        console.log("created release commit");

        await createVersionTag(version);

        console.log("created git tag");
    }
}
