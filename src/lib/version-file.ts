/**
 * Parsing Methods for a version file like package.json where the current version
 * can be extracted from and where the new version need to be set
 */

import * as fse from "fs-extra";
import { Version } from "../models/version";

// TODO: Make independent from package.json format and use a matcher to extract and override version
//  fields in different types of files like flutter version

// TODO: Load from config
const versionFile = "./package.json";
const regex = /"version": "([0-9.]+)"/m;

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

    const versionFileContent = await fse.readFile(versionFile, "utf-8");

    versionFileContent.replace(regex, version.toString());

    await fse.writeFile(versionFile, versionFileContent);
}
