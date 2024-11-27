import { Action } from "./action";
import fs from "fs";
import { createVersionTag, git, versionTagExists } from "../../lib/git";
import { config } from "../../lib/config";
import { getPackageVersion } from "../../lib/version-file";
import path from "node:path";
import chalk from "chalk";
import { logger } from "../../lib/util";
import { input, select } from "@inquirer/prompts";

/** The default path to the wersion rc */
const wersionConfigPath = path.join(process.cwd(), ".wersionrc.ts");

/**
 * Default matcher for semver in version file
 */
enum VersionMatcher {
    flutter = `version: ?\${semverMatcher}`,
    nodejs = `"version": ?"\${semverMatcher}"`,
}

/**
 * Default paths to version files
 */
enum VersionFile {
    flutter = "./pubspec.yaml",
    nodejs = "./package.json",
}

/**
 * The framework presets
 */
export enum Presets {
    flutter = "flutter",
    nodejs = "nodejs",
    custom = "custom",
}

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
        if (preset === Presets.custom) {
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
    async createConfigDialog(): Promise<string> {
        const defaultProjectName = path.basename(process.cwd());
        const preset = await select({
            message: "Choose the preset for the configuration by your projects programming language",
            choices: [
                {
                    name: "Node.js",
                    value: Presets.nodejs,
                },
                {
                    name: "Flutter",
                    value: Presets.flutter,
                },
                {
                    name: "Custom",
                    value: Presets.custom,
                },
            ],
        });
        const projectName = await input({
            message: "Name of your project, used to prefix created git tags",
            default: defaultProjectName,
        });

        const wersionrcTsContent = this.compileWersionRCTsTemplate(preset, projectName);
        fs.writeFileSync(wersionConfigPath, wersionrcTsContent);

        await git.add(".wersionrc.ts");
        logger.info("created .wersionrc.ts file");
        return preset;
    }

    /**
     * Creates an initial version tag if not already existing
     */
    async createInitialVersionTag() {
        const version = await getPackageVersion();

        if (!(await versionTagExists(version))) {
            const createdTag = await createVersionTag(version);
            logger.info("create initial version tag on last commit " + chalk.cyan(createdTag));
        }
    }

    /**
     * Compiles the file with the given answers from inquirer
     * @param preset The framework preset given by the user
     * @param projectName The name of the configured project
     */
    compileWersionRCTsTemplate(preset: Presets, projectName: string): string {
        let path, matcher: string;

        switch (preset) {
            case "flutter":
                path = VersionFile.flutter;
                matcher = VersionMatcher.flutter;
                break;
            case "nodejs":
                path = VersionFile.nodejs;
                matcher = VersionMatcher.nodejs;
                break;
            default:
                path = "<enter file>";
                matcher = VersionMatcher.nodejs;
                break;
        }

        return `import { WersionConfigModel, semverMatcher } from "@weichwarenprojekt/wersion";

export const configuration: Partial<WersionConfigModel> = {
  versionFile: {
      path: \`${path}\`,
      matcher: \`${matcher}\`
  },
  commitTypes: {
      major: [],
      minor: ["feat"],
      patch: ["fix"]
  },
  breakingChangeTrigger: "breaking change",
  changelogFilePath: "./CHANGELOG.md",
  projectName: "${projectName}"
};`;
    }
}
