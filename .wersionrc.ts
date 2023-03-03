import { WersionConfigModel } from "./src/models/wersion-config.model";

export const configuration: Partial<WersionConfigModel> = {
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
};
