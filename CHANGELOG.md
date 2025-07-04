# 1.6.0 (2025-06-30)
## Features
- support multiple scopes - #9 (762eb4a)
# 1.5.0 (2025-03-11)
## Features
- use conventional-commits-parser (9b8f9c5)
# 1.4.0 (2024-11-27)
## Features
- add info log for init command (3ee077a)
- exit cli with code 1 on error (3af7c94)
# 1.3.5 (2024-10-11)
## Bug Fixes
- remove engines field completely (56b367d)
# 1.3.4 (2024-10-11)
## Bug Fixes
- remove lock file (941e55d)
# 1.3.3 (2024-10-11)
## Bug Fixes
- remove packageManager entry before publishing (a505704)
# 1.3.2 (2024-10-10)
## Bug Fixes
- remove engines entry before publishing (2c4e4da)
# 1.3.1 (2024-10-10)
## Bug Fixes
- remove engineStrict field from package.json (2bddc31)
# 1.3.0 (2024-10-10)
## Features
- add --yes option to skip confirmations (5cc3f64)
## Bug Fixes
- use clean-package instead of pinst (9ee91de)
# 1.2.4 (2024-07-08)
## Bug Fixes
- changelog generation threw when encountering a non-conventional commit (4bfde61)
# 1.2.3 (2024-01-30)
## Bug Fixes
- also allow .mts configs (00b0711)
# 1.2.2 (2024-01-30)
## Bug Fixes
- add type definitions (ff983ec)
- ignore build number for the version tags (ebfe185)
# 1.2.1 (2023-07-05)
## Bug Fixes
- changelog generation didn't work with build numbers (c5d54c0)
# 1.2.0 (2023-05-06)
## Features
- add custom preset to init action (fb0d73f)
- allow releaseAs version without checking for changes (91b2827)
- create patch release on docs commit by default (a4182eb)
## Bug Fixes
- __build-number:__ usage as pre commit instead of post commit hook (bf1b275)
- npm install on publish to get the right version in package-lock.json (a17c119)
- __build-number:__ usage as pre commit instead of post commit hook (a700609)
- remove whitespace from generated config (9ccecf9)
# 1.1.0 (2023-04-27)
## Features
- use variable for verison matcher in wersionrc.ts (51cea3c)
# 1.0.1 (2023-04-23)
## Bug Fixes
- documentation of possible options wrong (65fdafe)
# 1.0.0 (2023-04-22)
## Features
- don't allow increment buildnumber on tagged commits (c04363c)
# 0.4.0 (2023-04-19)
## Features
- switch entirely to esm (3dc8e68)
- adjust init script and fix vitest tests (a89d294)
- __cli:__ commit updated version file at the end of incrementBuildNumber action (6cc215c)
- add init action (9b63458)
- __cli:__ add the incrementBuildNumber action (779136b)
## Bug Fixes
- close file handle when writing changelog (948173d)
- apply git log only to cwd (877d9e8)
- move husky to normal dependencies (cd742a8)
- fix version regex (e26bab9)
- use cwd as default git directory (620fce9)
- init script version matcher broken (f5331de)
- improve semantic version regex (b0d4ab5)
- optimize changelog generation (303dbe9)
- add npx to pinst to fix npm publish (eed1afb)
# 0.3.0 (2023-03-04)
## Features
- add projectName prefix option (8ec661e)
- __cli:__ add typescript configurations (2bb9fad)
## Bug Fixes
- add npx to pinst to fix npm publish (eed1afb)
- allow nullish value for releaseAs to allow override (3640433)
# 0.2.0 (2023-02-22)
## Features
- add dry-run cli option (4c1043f)
## Bug Fixes 
- don't throw whether no config file is found (e4810cb)
# 0.1.2 (2023-02-19)
## Bug Fixes
- changelog getting truncated sometimes (9828ac1)
- cli overhaul (9b3d43f)
# 0.1.1 (2023-02-12)
## Bug Fixes
- global execution and shebang (c75b7ba)
# 0.1.0 (2023-02-12)
## Features
- add stashing to exclude staged changes from version commit (b809abf)
- add custom release type to cli (9fad950)
- add wersionrc config (1f664f7)
- add changelog generation (5585259)
- determine release type by commit type (cc52384)
- implement basic release flow (5de52cf)
## Bug Fixes
- reset on error and fix git add failure (554a69c)
- misc bugfixes (1dca40e)
- overhaul changelog and version file config (d2867ae)
- add newly created changelog to git (276b1ea)
