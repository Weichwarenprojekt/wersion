import { Action } from "./action";
import { defaultWersionConfig } from "../../models/wersion-config.model";
import fs from "fs";
import { createVersionTag, versionTagExists } from "../../lib/git";
import { config } from "../../lib/config";
import { getPackageVersion } from "../../lib/version-file";
import inquirer from "inquirer";
import path from "node:path";
import chalk from "chalk";
import fse from "fs-extra";

const wersionConfigPath = path.join(process.cwd(), ".wersionrc.ts");

const ui = new inquirer.ui.BottomBar();

export class InitAction implements Action {
    description = "Initializes the project with wersion";
    name = "init";

    async run() {
        if (!this.configFileExists()) {
            await this.createConfigDialog();
        }

        config.loadConfigFile(wersionConfigPath);

        await this.createInitialVersionTag();

        ui.log.write(chalk.green("Finished, Have Fun!"));
    }

    /**
     * Use inquirer to create the .wersionrc.ts config file
     */
    async createConfigDialog() {
        const defaultProjectName = path.basename(process.cwd());

        const answers = await inquirer.prompt([
            {
                name: "project_name",
                message: "Name of your project, used to prefix created git tags",
                default: defaultProjectName,
            },
            {
                name: "version_file_path",
                message: "Path to the file where your version is stored, e.g. a package.json",
                default: defaultWersionConfig.versionFile.path,
            },
            {
                name: "version_file_matcher",
                message: "Regex with should be used to extract the version from the version file",
                default: defaultWersionConfig.versionFile.matcher,
            },
            {
                name: "changelog_path",
                message: "Relative path of the changelog file",
                default: defaultWersionConfig.changelogFilePath,
            },
        ]);

        const wersionrcTsContent = this.compileWersionrcTsTemplate(answers);
        fs.writeFileSync(wersionConfigPath, wersionrcTsContent);
        ui.log.write("created .wersionrc.ts file");
    }

    /**
     * Creates an initial version tag if not already existing
     */
    async createInitialVersionTag() {
        const version = await getPackageVersion();

        if (!(await versionTagExists(version))) {
            const createdTag = await createVersionTag(version);
            ui.log.write("create initial version tag on last commit " + chalk.cyan(createdTag));
        }
    }

    /**
     * Checks whether a config file already exists
     */
    configFileExists(): boolean {
        return !!fse.statSync(wersionConfigPath, { throwIfNoEntry: false })?.isFile();
    }

    /**
     * Compiles the file with the given answers from inquirer
     * @param vars
     */
    compileWersionrcTsTemplate(vars: {
        changelog_path: string;
        version_file_matcher: string;
        version_file_path: string;
        project_name: string;
    }): string {
        return `import { WersionConfigModel } from "./src/models/wersion-config.model";

  export const configuration: Partial<WersionConfigModel> = {
    versionFile: {
        path: "${vars.version_file_path}",
        matcher: '${vars.version_file_matcher}',
    },
    commitTypes: {
        major: [],
        minor: ["feat"],
        patch: ["fix"]
    },
    breakingChangeTrigger: "breaking change",
    changelogFilePath: "${vars.changelog_path}",
    projectName: "${vars.project_name}",
  };`;
    }
}
