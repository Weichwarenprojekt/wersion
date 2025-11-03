import { Action } from "./action";
import fs from "fs";
import { createVersionTag, git, versionTagExists } from "../../lib/git";
import { config } from "../../lib/config";
import { getPackageVersion } from "../../lib/version-file";
import path from "node:path";
import chalk from "chalk";
import { logger } from "../../lib/util";
import { input, select } from "@inquirer/prompts";
import _ from "lodash";
import { WersionConfigModel } from "../../models/wersion-config.model";

/** The default path to the wersion rc */
const wersionConfigPath = path.join(process.cwd(), ".wersionrc.ts");

/**
 * The configuration for a preset
 */
export type PresetConfig = Partial<WersionConfigModel> & {
    optionName: string;
    subconfig?: Record<string, PresetConfig>;
};

/**
 * The framework / language presets
 */
export enum Presets {
    flutter = "flutter",
    nodejs = "nodejs",
    rust = "rust",
    python = "python",
    custom = "custom",
}

/**
 * The sub-presets for the NodeJS preset
 */
export enum NodeJSPresets {
    npm = "npm",
    other = "other",
}

/**
 * The configuration for each preset
 */
const presetConfigs: Record<string, PresetConfig> = {
    [Presets.flutter]: {
        optionName: "Dart / Flutter (pubspec.yaml)",
        versionFile: {
            path: "./pubspec.yaml",
            matcher: `version: *{{semverMatcher}}`,
        },
    },
    [Presets.nodejs]: {
        optionName: "JavaScript / Node.js (package.json)",
        versionFile: {
            path: "./package.json",
            matcher: `"version": *"{{semverMatcher}}"`,
        },
        subconfig: {
            [NodeJSPresets.npm]: {
                optionName: "NPM",
                beforeCommit: "npm i",
                filesToCommit: ["package-lock.json"],
            },
            [NodeJSPresets.other]: {
                optionName: "Other (Yarn, PNPM, etc.)",
            },
        },
    },
    [Presets.rust]: {
        optionName: "Rust (Cargo.toml)",
        versionFile: {
            path: "./Cargo.toml",
            matcher: `version *= *"{{semverMatcher}}"`,
        },
    },
    [Presets.python]: {
        optionName: "Python (pyproject.toml)",
        versionFile: {
            path: "./pyproject.toml",
            matcher: `version *= *"{{semverMatcher}}"`,
        },
    },
    [Presets.custom]: {
        optionName: "Custom",
        versionFile: {
            path: "<enter file>",
            matcher: `"version": *"{{semverMatcher}}"`,
        },
    },
};

/**
 * The action to configure the project for wersion
 */
export class InitAction implements Action {
    /** The name of the action */
    name = "init";

    /** The description of the action */
    description = "Adds a 0.0.0 tag on the first commit and initializes the configuration.";

    /**
     * Run the action
     */
    async run() {
        // Create a wersion rc
        let preset = "";
        if (!fs.existsSync(wersionConfigPath)) {
            preset = await this.createConfigDialog();
        } else {
            logger.info("Found a .wersionrc.ts. Skipping configuration step!");
        }

        // Confirm creation and create initial tag or warn user if using a custom template
        if (preset === Presets.custom || !presetConfigs[preset]) {
            logger.info(
                "You have to manually adjust the configured version file in the config. Make sure the version matcher regex is correct, the default is for a json file.",
            );
            logger.warn(
                chalk.yellow(
                    `Configure your version file and run "${chalk.bold("wersion --init")}" again to ensure that the initial tag is set!`,
                ),
            );
        } else {
            config.loadConfigFile(wersionConfigPath);
            await this.createInitialVersionTag();
            logger.info(chalk.green("Finished, Have Fun!"));
        }
    }

    /**
     * Use inquirer to create the .wersionrc.ts config file
     */
    private async createConfigDialog(): Promise<string> {
        const defaultProjectName = path.basename(process.cwd());

        // First select the language / framework preset
        const preset = await select({
            message: "Choose the preset for the configuration by your projects programming language",
            choices: _.map(presetConfigs, (value, key) => ({
                name: value.optionName,
                value: key,
            })),
        });
        const presetConfig = presetConfigs[preset] ?? {};
        this.updateConfigWithPreset(presetConfig);

        // If there are sub-presets, ask the user which one to use
        const subConfigs = presetConfig.subconfig;
        if (subConfigs) {
            const subPreset = await select({
                message: "Choose the package manager you are using",
                choices: _.map(subConfigs, (value, key) => ({
                    name: value.optionName,
                    value: key,
                })),
            });
            this.updateConfigWithPreset(subConfigs[subPreset]);
        }

        // Retrieve the project name from the user
        const projectName = await input({
            message: "Name of your project, used to prefix created git tags",
            default: defaultProjectName,
        });

        // Create the .wersionrc.ts file
        const wersionrcTsContent = this.compileWersionRCTsTemplate(projectName);
        fs.writeFileSync(wersionConfigPath, wersionrcTsContent);
        await git.add(".wersionrc.ts");
        logger.info("created .wersionrc.ts file");
        return preset;
    }

    /**
     * Updates the config with the given preset config
     */
    private updateConfigWithPreset = (presetConfig?: PresetConfig) => {
        config.set(_.omit(presetConfig ?? {}, "optionName", "subconfig"));
    };

    /**
     * Creates an initial version tag if not already existing
     */
    private async createInitialVersionTag() {
        const version = await getPackageVersion();

        if (!(await versionTagExists(version))) {
            const createdTag = await createVersionTag(version);
            logger.info("create initial version tag on last commit " + chalk.cyan(createdTag));
        }
    }

    /**
     * Compiles the file with the given answers from inquirer
     * @param projectName The name of the configured project
     */
    private compileWersionRCTsTemplate(projectName: string): string {
        // Define the head of the template
        let template =
            `import { WersionConfigModel } from "@weichwarenprojekt/wersion";\n\n` +
            `export const configuration: Partial<WersionConfigModel> = {\n` +
            `  versionFile: {\n` +
            `      path: \`${config.config.versionFile.path}\`,\n` +
            `      matcher: \`${config.config.versionFile.matcher}\`\n` +
            `  },\n` +
            `  commitTypes: {\n` +
            `      major: [],\n` +
            `      minor: ["feat"],\n` +
            `      patch: ["fix"]\n` +
            `  },\n`;

        // Check if beforeCommit or filesToCommit are needed
        const beforeCommit = config.config.beforeCommit?.trim();
        if (beforeCommit) template += `  beforeCommit: "${beforeCommit}",\n`;
        const filesToCommit = config.config.filesToCommit;
        if (filesToCommit && filesToCommit.length > 0) {
            const filesString = filesToCommit.map((file) => `"${file}"`).join(", ");
            template += `  filesToCommit: [${filesString}],\n`;
        }

        // Add the rest of the template
        template +=
            `  breakingChangeTrigger: "breaking change",\n` +
            `  changelogFilePath: "./CHANGELOG.md",\n` +
            `  projectName: "${projectName}"\n` +
            `};`;
        return template;
    }
}
