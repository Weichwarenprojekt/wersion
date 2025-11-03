/**
 * The semantic version matcher
 */
export const semverMatcher =
    "((0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?)";

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
    /** An optional command that is executed before the commit is created */
    beforeCommit?: string;
    /** An optional list of files that can be added to the automatic commit */
    filesToCommit?: string[];
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
export const getDefaultWersionConfig = (): WersionConfigModel => ({
    versionFile: {
        path: "./package.json",
        matcher: `"version": *"{{semverMatcher}}"`,
    },
    commitTypes: {
        major: [],
        minor: ["feat"],
        patch: ["fix", "docs"],
    },
    breakingChangeTrigger: "breaking change",
    changelogFilePath: "./CHANGELOG.md",
    projectName: "",
});
