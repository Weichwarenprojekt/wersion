import * as semver from "semver";

/**
 * The release type
 */
export enum ReleaseType {
    major = "major",
    minor = "minor",
    patch = "patch",
    prerelease = "prerelease",
}

/**
 * The version model that helps to manage the semantic version
 */
export class Version {
    /** The version string */
    private semanticVersion: string | null;

    /**
     * Constructor
     */
    constructor(versionString: string) {
        this.semanticVersion = semver.valid(versionString);
    }

    /**
     * Ince
     * @param releaseType
     */
    increase(releaseType: ReleaseType) {
        this.semanticVersion = semver.inc(this.semanticVersion ?? "", releaseType);
    }

    /**
     * Converts version to string
     */
    toString(): string {
        return this.semanticVersion ?? "";
    }
}
