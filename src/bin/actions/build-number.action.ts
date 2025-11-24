import { Action } from "./action";
import { addFilesToCommit, executeBeforeCommitScript } from "../../lib/git";
import { getPackageVersion, setPackageVersion } from "../../lib/version-file";
import { ReleaseType } from "../../lib/version";
import { logger } from "../../lib/util";

/**
 * The action for incrementing the build number
 */
export class BuildNumberAction implements Action {
    /** The name of the action */
    name = "incrementBuildNumber";

    /** The description of the action */
    description = "Increments the build number by one.";

    /**
     * Run the action
     */
    async run(): Promise<void> {
        const version = await getPackageVersion();
        version.increase(ReleaseType.build);
        await setPackageVersion(version);
        executeBeforeCommitScript();
        await addFilesToCommit();
        logger.info(`Version was incremented to ${version.toString()}. The update was appended to the last commit.`);
    }
}
