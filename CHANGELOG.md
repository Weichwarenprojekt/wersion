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
