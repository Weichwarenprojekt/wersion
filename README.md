<div align="center">
    <br>
    <img src="assets/logo.png" width="250" alt=""/>
</div>

# Quickstart

Wersion offers you an automatic workflow for improving your deployment process. It increases your projects version (
including adding a git tag) and generates a release log from your git history.
To determine how the version must be increased wersion uses the commit type from conventional commits. E.g. a fix commit
results in increasing the patch version. The default behaviour can be adjusted with a custom
config ([Configuration](#configuration)).

**Installation**

```
npm i @weichwarenprojekt/wersion --save-dev
```

**Initialization**

The initialization command creates the .wersionrc.ts configration file. The created config depends on the selected
preset (npm or flutter).
Further the command will create a git tag on the last commit with the current version of your project to enable
versioning.

```
npx wersion --init
```

**Execution**

Basic usage to create a new version:

```
npx wersion
```

Creating a new version includes creating the tag, increasing the version in the configured version file and creating the
changelog.

```
npx wersion --releaseAs=[patch|minor|major]
```

See ([Options](#options)) for further information

# Automatic Versioning

Wersion will increase the version once the script is called depending on your git history since the last version tag.
It uses the conventional commit style to determine which part of the version has to be increased. A fix commit ("fix(
scope): Message) will increase the patch version of your project. Similarly, a feat commit will increase your minor
version. Your major version will only be automatically increased if a commit contains a breaking change. This is
signalized by the string "breaking change" in a commits body.
The whole behaviour can be adjusted with different commit types for different version increases and a custom breaking
change text.
Alternatively your always free to increase the version customized by running `wersion --releaseAs=[patch|minor|major]`.

# Changelog generation

The generated text will be added to your changelog file (path and name customizable). Wersion uses your git history and
groups commits in feature and bugfix blocks. Those blocks than are added to the changelog file with the new version as
the header.
For an example checkout the CHANGELOG.md of wersion itself.

# Options

``` 
wersion --releaseAs=[patch|minor|major]
```

The "releaseAs" option allows you to manually increase the version of your project.

``` 
wersion --dry-run
```

"dry-run" prevents wersion from generation any commits or file-changes. Useful for testing the command and see which
versions will be increased.

```
wersion --incrementBuildNumber
```

This mode allows you to increment the build number for local commits. E.g. you can use it in combination with husky
hooks to automatically increment your build number each time you create a new commit.

# Configuration

Configure your project with a .wersionrc.ts file on top level. \
Default configuration:

```ts
import {WersionConfigModel} from "@weichwarenprojekt/wersion";

export const configuration: Partial<WersionConfigModel> = {
    versionFile: {
        path: "./package.json",
        matcher: `"version": *"{{semverMatcher}}"`,
    },
    commitTypes: {
        major: [],
        minor: ["feat"],
        patch: ["fix", "docs"],
    },
    beforeCommit: "npm i",
    filesToCommit: ["./package-lock.json"],
    breakingChangeTrigger: "breaking change",
    changelogFilePath: "./CHANGELOG.md",
    projectName: "",
};
```

| Config                |         | Description                                                                                                |
|-----------------------|---------|------------------------------------------------------------------------------------------------------------|
| versionFile           |         |                                                                                                            |
|                       | path    | Path to the file in which the projects version is tracked (e.g. ./package.json )                           |
|                       | matcher | Regex matcher to select the version inside the version file                                                |
| commitTypes           |         |                                                                                                            |
|                       | major   | Array of commit types which trigger a increase of the major version e.g. ["feat"]                          |
|                       | minor   | same for minor version                                                                                     |
|                       | patch   | same for patch version                                                                                     |
| beforeCommit          |         | Optional shell command that runs before the release commit is created                                      |
| filesToCommit         |         | Optional array of files that will be staged together with changelog and version file                       |
| breakingChangeTrigger |         | String that triggers an breaking change ergo an increase of the major version if written in a commits body |
| changelogFilePath     |         | Configuration of the automatically generated changelog file (e.g. ./CHANGELOG.md)                          |
| projectName           |         | Optional project name which is prepended to each git tag                                                   |

With our comprehensive configuration options you can configure wersion for any language / framework / project.

# Troubleshooting

## The current file is a CommonJS module whose imports will produce require calls

This happens because you probably have configured version for a CommonJS package/project (no "type": "module" in the
package.json). Rename the configuration to .wersionrc.mts. Like that it will be treated as an ESM module.

```ATTENTION``` The configuration will still be imported as a CommonJS module, so you will not be able to actually
import ESM modules! This is just for the error to disappear.

# Contribution

Feel free creating an issue or PR :)

## e2e

We are using an extra repository to create the project structure in which we are running our e2e
tests: http://github.com/Weichwarenprojekt/wersion-e2e
