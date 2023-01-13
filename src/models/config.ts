export interface ConfigModel {
    versionFile: {
        path: string;
        matcher: string;
    };
    format: string;
    commitTypes: {
        major: string[];
        minor: string[];
        patch: string[];
    };
    breakingChangeTrigger: string;
    changelogFilePath: string;
}
