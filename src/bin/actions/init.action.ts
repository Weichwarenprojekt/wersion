import { Action } from "./action";
import fs from "fs";
import { createVersionTag, git, versionTagExists } from "../../lib/git";
import { config } from "../../lib/config";
import { getPackageVersion } from "../../lib/version-file";
import inquirer from "inquirer";
import path from "node:path";
import chalk from "chalk";
import { logger } from "../../lib/util";

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
        if (!fs.existsSync(wersionConfigPath)) {
            await this.createConfigDialog();
        } else {
            logger.info("Found a .wersionrc.ts. Skipping configuration step!");
        }

        config.loadConfigFile(wersionConfigPath);

        await this.createInitialVersionTag();

        logger.info(chalk.green("Finished, Have Fun!"));
    }

    /**
     * Use inquirer to create the .wersionrc.ts config file
     */
    async createConfigDialog() {
        const defaultProjectName = path.basename(process.cwd());

        const answers = await inquirer.prompt([
            {
                name: "preset",
                type: "list",
                message: "Choose the preset for the configuration by your projects programming language",
                choices: ["Node.js", "Flutter", "Custom"],
            },
            {
                name: "projectName",
                message: "Name of your project, used to prefix created git tags",
                default: defaultProjectName,
            },
        ]);

        const wersionrcTsContent = this.compileWersionRCTsTemplate(answers);
        fs.writeFileSync(wersionConfigPath, wersionrcTsContent);

        await git.add(".wersionrc.ts");
        logger.info("created .wersionrc.ts file");
        if (answers.preset === "Custom")
            logger.info(
                "you have to manually adjust the configured version file in the config. Make sure the version matcher regex is correct, the default is for a json file.",
            );
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
     * @param vars The variables that were queried from inquirer
     */
    compileWersionRCTsTemplate(vars: { preset: string; projectName: string }): string {
        let path, matcher: string;

        switch (vars.preset) {
            case "Flutter":
                path = VersionFile.flutter;
                matcher = VersionMatcher.flutter;
                break;
            case "Node.js":
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
  projectName: "${vars.projectName}"
};`;
    }
}
