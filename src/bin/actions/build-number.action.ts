import { Action } from "./action";
import { commitHasTag, git, repoHasLocalCommits } from "../../lib/git";
import { getPackageVersion, getVersionFile, setPackageVersion } from "../../lib/version-file";
import { ReleaseType } from "../../lib/version";
import { logger } from "../../lib/util";

/**
 * The action for incrementing the build number
 */
export class BuildNumberAction implements Action {
    /** The name of the action */
    name = "incrementBuildNumber";

    /** The description of the action */
    description = "Increments the build number by one and appends it to the last commit.";

    /**
     * Run the action
     */
    async run(): Promise<void> {
        if (await commitHasTag()) {
            logger.error(
                "You cannot increase the build number of an already tagged commit. This would change its hash and the tag won't match the right commit anymore",
            );
            return;
        }

        // Only execute if there are local commits
        if (!(await repoHasLocalCommits())) {
            logger.warn(
                "No local commits detected. The --incrementBuildNumber action should only be executed if your repository has local commits to which the changes can be appended to. It is recommended to automatically execute the action in a post commit hook.",
            );
            return;
        }

        const version = await getPackageVersion();
        version.increase(ReleaseType.build);
        await setPackageVersion(version);
        await git.add(getVersionFile());
        await git.commit([], { "--amend": null, "--no-edit": null });
        logger.info(`Version was incremented to ${version.toString()}. The update was appended to the last commit.`);
    }
}
