import * as semver from "semver";

export enum ReleaseType {
    major = "major",
    premajor = "premajor",
    minor = "minor",
    preminor = "preminor",
    patch = "patch",
    prepatch = "prepatch",
    prerelease = "prerelease",
}

export class Version {
    private semanticVersion: string = null;

    constructor(versionString: string) {
        this.semanticVersion = semver.valid(versionString);
    }

    increase(releaseType: ReleaseType) {
        this.semanticVersion = semver.inc(this.semanticVersion, releaseType);
    }

    toString(): string {
        return this.semanticVersion;
    }
}
