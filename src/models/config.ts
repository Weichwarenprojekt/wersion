export interface ConfigModel {
    versionFile: {
        name: string;
        matcher: string;
    };
    format: string;
    commitTypes: {
        major: string[];
        minor: string[];
        patch: string[];
    };
    breakingChangeTrigger: string;
    changelogFile: {
        name: string;
        absolute: boolean;
        path: string;
    };
}
