import { WersionConfigModel } from "./dist/src/models/wersion-config.model";

export const configuration: Partial<WersionConfigModel> = {
    commitTypes: {
        major: [],
        minor: ["feat"],
        patch: ["fix"],
    },
    breakingChangeTrigger: "breaking change",
    changelogFilePath: "./CHANGELOG.md",
    projectName: "wersion",
};
