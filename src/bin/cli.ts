#!/usr/bin/env node

import { Command } from "commander";
import { DefaultAction } from "./actions/default.action";
import { defaultCliOptions } from "../models/cli-options.model";
import { config } from "../lib/config";
import packageJson from "../../package.json" assert { type: "json" };
import { BuildNumberAction } from "./actions/build-number.action";
import { InitAction } from "./actions/init.action";
import { logger } from "../lib/util";

/**
 * The start point of the cli
 */
const main = async () => {
    const program = new Command();
    const actions = [new DefaultAction(), new BuildNumberAction(), new InitAction()];

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

    try {
        let actionToBeExecuted = actions[0];
        for (const action of actions) {
            if (options[action.name]) actionToBeExecuted = action;
        }

        if (actionToBeExecuted.name !== "init") {
            config.loadConfigFile(options.config);
            config.set(options);
        }

        await actionToBeExecuted.run();
    } catch (e) {
        if (e instanceof Error) logger.error(e.message);
        else logger.error("Unknown Error!");
    }
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
main().then(() => {});
