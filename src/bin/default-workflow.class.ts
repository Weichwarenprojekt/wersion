import { getPackageVersion, setPackageVersion } from "../lib/version-file";
import { ReleaseType } from "../models/version";
import { createVersionCommit, createVersionTag, getReleaseTypeForHistory } from "../lib/git";
import chalk from "chalk";

export class DefaultWorkflowClass {
    async run() {
        const version = await getPackageVersion();

        const releaseType: ReleaseType = await getReleaseTypeForHistory(version);

        await version.increase(releaseType);

        console.log("release new version " + chalk.cyan(version.toString()));

        await setPackageVersion(version);

        //await generateChangelog(); // TODO

        await createVersionCommit(version);

        console.log("created release commit");

        await createVersionTag(version);

        console.log("created git tag");
    }
}
