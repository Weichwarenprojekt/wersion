/**
 * Parsing Methods for a version file like package.json where the current version
 * can be extracted from and where the new version need to be set
 */

import * as fse from "fs-extra";
import { Version } from "../models/version";
import { Config } from "./config.class";

const versionFile = Config.getInstance().config.versionFile.name ?? "package.json";
const regexFromConfig = Config.getInstance().config.versionFile.matcher ?? '"version": "([0-9.]+)"';
const regex = new RegExp(regexFromConfig);

/**
 * Check whether the version file exists
 */
function checkVersionFileExists() {
    if (!fse.statSync(versionFile).isFile()) {
        throw new Error("No version file exists in the current directory");
    }
}

/**
 * Extract the current package version from the version file
 */
export async function getPackageVersion(): Promise<Version> {
    checkVersionFileExists();

    const versionFileContent = await fse.readFile(versionFile, "utf-8");

    // TODO: Use line number to select version in file (edge case: version at end
    //  of package.json file and dependency with name version is installed)
    const regexResponse = regex.exec(versionFileContent);
    if (!Array.isArray(regexResponse)) {
        throw new Error("Cannot find version in version file");
    }

    return new Version(regexResponse[1]);
}

/**
 * Overrides the old version in the version file with the new one
 *
 * @param version
 */
export async function setPackageVersion(version: Version) {
    checkVersionFileExists();

    let versionFileContent = await fse.readFile(versionFile, "utf-8");

    const versionRegexResponse = regex.exec(versionFileContent);
    const newVersionText = versionRegexResponse[0].replace(versionRegexResponse[1], version.toString());

    versionFileContent = versionFileContent.replace(regex, newVersionText);

    await fse.writeFile(versionFile, versionFileContent);
}
