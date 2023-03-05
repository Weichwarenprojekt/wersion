#!/usr/bin/env node

import { Command } from "commander";
import { DefaultAction } from "./actions/default.action";
import { defaultCliOptions } from "../models/cli-options.model";
import { config } from "../lib/config";
import { BuildNumberAction } from "./actions/build-number.action";

const main = async () => {
    const packageJson = await import("../../package.json");
    const program = new Command();
    const actions = [new DefaultAction(), new BuildNumberAction()];

    program.name(packageJson.name).version(packageJson.version).description(packageJson.description);

    program.option("--config <configPath>", "The path the config file.", defaultCliOptions.config);
    program.option(
        "--dry-run",
        "If true, wersion will not make any git changes. Like that you can test the outcome of wersion.",
        defaultCliOptions.dryRun,
    );
    program.option(
        "--releaseAs <releaseType>",
        "Set the release type manually. Creates a new tag and release commit of given type.",
    );
    for (const action of actions) {
        program.option(`--${action.name}`, action.description);
    }

    program.parse();

    const options = program.opts();
    config.loadConfigFile(options.config);
    config.set(options);

    try {
        let actionToBeExecuted = actions[0];
        for (const action of actions) {
            if (options[action.name]) actionToBeExecuted = action;
        }
        await actionToBeExecuted.run();
    } catch (e) {
        console.error(e);
    }
};

main().then(() => process.exit());
