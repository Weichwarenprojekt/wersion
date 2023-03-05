import { ReleaseType, Version } from "../../src/lib/version";
import semver from "semver";

describe("version test", () => {
    it("sets default version if given version is invalid", () => {
        const version = new Version("wtf");
        expect(version.toString()).toEqual("0.0.0");
    });

    it("appends build number if it isn't set yet", () => {
        const version = new Version("0.1.0");
        version.increase(ReleaseType.build);
        expect(version.toString()).toEqual("0.1.0+1");
    });

    it("increases build number", () => {
        const version = new Version("1.0.0+29");
        version.increase(ReleaseType.build);
        expect(version.toString()).toEqual("1.0.0+30");
    });

    it("resets build number if it isn't a number", () => {
        const version = new Version("1.0.0+test");
        version.increase(ReleaseType.build);
        expect(version.toString()).toEqual("1.0.0+1");
    });

    it("increases patch number", () => {
        const version = new Version("1.0.0");
        version.increase(ReleaseType.patch);
        expect(version.toString()).toEqual("1.0.1");
    });

    it("increases patch number and removes build number", () => {
        const version = new Version("2.0.0+20");
        version.increase(ReleaseType.patch);
        expect(version.toString()).toEqual("2.0.1");
    });

    it("increases minor number", () => {
        const version = new Version("1.0.0");
        version.increase(ReleaseType.minor);
        expect(version.toString()).toEqual("1.1.0");
    });

    it("increases minor number and removes build number", () => {
        const version = new Version("2.0.0+30");
        version.increase(ReleaseType.minor);
        expect(version.toString()).toEqual("2.1.0");
    });

    it("increases major number", () => {
        const version = new Version("1.0.0");
        version.increase(ReleaseType.major);
        expect(version.toString()).toEqual("2.0.0");
    });

    it("increases major number and removes build number", () => {
        const version = new Version("2.0.0+40");
        version.increase(ReleaseType.major);
        expect(version.toString()).toEqual("3.0.0");
    });

    it("falls back to default version if increasing fails", () => {
        const semverInc = jest.spyOn(semver, "inc").mockImplementation(() => null);
        const version = new Version("1.0.0");
        version.increase(ReleaseType.major);
        expect(version.toString()).toEqual("0.0.0");
        semverInc.mockRestore();
    });
});
