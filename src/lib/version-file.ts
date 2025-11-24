/**
 * Parsing Methods for a version file like package.json where the current version
 * can be extracted from and where the new version has to be set
 */

import fs from "fs";
import { Version } from "./version";
import { config } from "./config";
import { semverMatcher } from "../models/wersion-config.model";

/**
 * Returns the path to the version file from config
 */
export function getVersionFile() {
    return config.config.versionFile.path;
}

/**
 * Returns the version regex from the config
 * This regular expression is used to extract the version from the version file or to override it with the incremented one
 */
function getVersionRegex() {
    const regexFromConfig = config.config.versionFile.matcher;
    return new RegExp(regexFromConfig.replace("{{semverMatcher}}", semverMatcher));
}

/**
 * Check whether the version file exists
 */
function checkVersionFileExists() {
    if (!fs.existsSync(getVersionFile())) {
        throw new Error("No version file exists in the current directory");
    }
}

/**
 * Extract the current package version from the version file
 */
export async function getPackageVersion(): Promise<Version> {
    checkVersionFileExists();

    const versionFileContent = fs.readFileSync(getVersionFile(), "utf-8");
    const regexResponse = getVersionRegex().exec(versionFileContent);
    if (!Array.isArray(regexResponse)) {
        throw new Error("Cannot find version in version file");
    }

    return new Version(regexResponse[1]);
}

/**
 * Overrides the old version in the version file with the new one
 */
export async function setPackageVersion(version: Version) {
    checkVersionFileExists();

    let versionFileContent = fs.readFileSync(getVersionFile(), "utf-8");

    const versionRegexResponse = getVersionRegex().exec(versionFileContent);
    if (!versionRegexResponse || !versionRegexResponse[0] || !versionRegexResponse[1]) {
        throw new Error("The regex could not match a version in your specified version file!");
    }
    const newVersionText = versionRegexResponse[0].replace(versionRegexResponse[1], version.toString());

    versionFileContent = versionFileContent.replace(getVersionRegex(), newVersionText);

    if (!config.config.dryRun) fs.writeFileSync(getVersionFile(), versionFileContent);
}
