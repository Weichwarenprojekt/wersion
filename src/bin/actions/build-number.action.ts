import { Action } from "./action";
import { getPackageVersion, setPackageVersion } from "../../lib/version-file";
import { ReleaseType } from "../../lib/version";

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
        const version = await getPackageVersion();
        version.increase(ReleaseType.build);
        await setPackageVersion(version);
    }
}
