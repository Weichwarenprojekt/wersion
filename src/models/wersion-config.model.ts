/**
 * The model that defines the configuration options for wersion
 */
export interface WersionConfigModel {
    /** Configure the file that contains the version information of the project */
    versionFile: {
        /** Path to the file (e.g. to the package.json) */
        path: string;
        /** The matcher that helps to update the version information */
        matcher: string;
    };
    /** The commit types that lead to version changes */
    commitTypes: {
        /** Commit types that are mentioned here will increase the major version */
        major: string[];
        /** Commit types that are mentioned here will increase the minor version */
        minor: string[];
        /** Commit types that are mentioned here will increase the patch version */
        patch: string[];
    };
    /** The keyword that signalizes a breaking change */
    breakingChangeTrigger: string;
    /** The path to the changelog file */
    changelogFilePath: string;
    /** The name of the project which is used as a prefix for all created versions */
    projectName: string;
}

/**
 * The default wersion configuration
 */
export const defaultWersionConfig: WersionConfigModel = {
    versionFile: {
        path: "./package.json",
        matcher: '"version": ?"([0-9.]+)"',
    },
    commitTypes: {
        major: [],
        minor: ["feat"],
        patch: ["fix"],
    },
    breakingChangeTrigger: "breaking change",
    changelogFilePath: "./CHANGELOG.md",
    projectName: ""
};
