import semver from "semver";

/**
 * The release type
 */
export enum ReleaseType {
    major = "major",
    minor = "minor",
    patch = "patch",
    prerelease = "prerelease",
    build = "build",
}

/**
 * The fallback version if an input version is invalid
 */
const defaultVersion = "0.0.0";

/**
 * The version model that helps to manage the semantic version
 */
export class Version {
    /** The version string */
    private semanticVersion: string;

    /**
     * Constructor
     */
    constructor(versionString: string) {
        this.semanticVersion = semver.valid(versionString) ? versionString : defaultVersion;
    }

    /**
     * Update the version
     * @param releaseType The type of release
     */
    public increase(releaseType: ReleaseType): void {
        if (releaseType === ReleaseType.build) {
            this.increaseBuildNumber();
        } else {
            this.semanticVersion = semver.inc(this.semanticVersion, releaseType) ?? defaultVersion;
        }
    }

    /**
     * Increases the build number
     */
    private increaseBuildNumber(): void {
        if (this.semanticVersion.includes("+")) {
            const tokens = this.semanticVersion.split("+");
            const buildNumber = parseInt(tokens[1]);
            if (isNaN(buildNumber)) {
                this.semanticVersion = `${tokens[0]}+1`;
            } else {
                this.semanticVersion = `${tokens[0]}+${buildNumber + 1}`;
            }
        } else {
            this.semanticVersion += "+1";
        }
    }

    /**
     * Converts version to string
     */
    public toString(): string {
        return this.semanticVersion;
    }
}
