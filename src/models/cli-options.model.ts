import { ReleaseType } from "../lib/version";

/**
 * Options that can be passed into the default workflow from the cli
 */
export interface CliOptionsModel {
    /** The path the config file. */
    config: string;
    /** If true, every confirmation is automatically accepted. */
    yes: boolean;
    /** If true, wersion will not make any git changes. Like that you can test the outcome of wersion. */
    dryRun?: boolean;
    /** Set the release type manually. Creates a new tag and release commit of given type. */
    releaseAs?: ReleaseType | null;
}

/**
 * The default cli options
 */
export const defaultCliOptions: CliOptionsModel = {
    config: "./.wersionrc.ts",
    yes: false,
    dryRun: false,
};
