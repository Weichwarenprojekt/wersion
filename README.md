<div align="center">
    <br>
    <img src="logo.png" width="250" alt=""/>
</div>

# Quickstart

Wersion offers you an automatic workflow for improving your deployment process. It increases your projects version (including adding a git tag) and generates a release log from your git history.
To determine how the version must be increased wersion uses the commit type from conventional commits. E.g. a fix commit results in increasing the patch version. The default behaviour can be adjusted with a custom config ([Configuration](#configuration)).

**Installation**

```
npm i -g @weichwarenprojekt/wersion
```

**Execution**

```
wersion
```

```
wersion --releaseAs=[patch|minor|major]
```

# Automatic Versioning

Wersion will increase the version once the script is called depending on your git history since the last version tag.
It uses the conventional commit style to determine which part of the version has to be increased. A fix commit ("fix(scope): Message) will increase the patch version of your project. Similarly, a feat commit will increase your minor version. Your major version will only be automatically increased if a commit contains a breaking change. This is signalized by the string "breaking change" in a commits body.
The whole behaviour can be adjusted with different commit types for different version increases and a custom breaking change text.
Alternatively your always free to increase the version customized by running `wersion --releaseAs=[patch|minor|major]`.

# Changelog generation

The generated text will be added to your changelog file (path and name customizable). Wersion uses your git history and groups commits in feature and bugfix blocks. Those blocks than are added to the changelog file with the new version as the header.
For an example checkout the CHANGELOG.md of wersion itself.

# Configuration

Configure your project with a .wersionrc.json file on top level. \
Default configuration:

```json
{
    "versionFile": {
        "path": "./package.json",
        "matcher": "\"version\": \"([0-9.]+)\""
    },
    "commitTypes": {
        "major": [],
        "minor": ["feat"],
        "patch": ["fix"]
    },
    "breakingChangeTrigger": "breaking change",
    "changelogFilePath": "./CHANGELOG.md"
}
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
| breakingChangeTrigger |         | String that triggers an breaking change ergo an increase of the major version if written in a commits body |
| changelogFilePath     |         | Configuration of the automatically generated changelog file (e.g. ./CHANGELOG.md)                          |
