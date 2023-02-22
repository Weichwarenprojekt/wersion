import { ReleaseType } from "./version";

/**
 * Options that can be passed into the default workflow from the cli
 */
export interface CliOptions {
    releaseAs?: ReleaseType;
    dryRun?: boolean;
}
