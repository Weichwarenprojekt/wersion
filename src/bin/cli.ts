#!/usr/bin/env node

import { Command } from "commander";
import { DefaultAction } from "./actions/default-action";
import { defaultCliOptions } from "../models/cli-options.model";
import { config } from "../lib/config";
import packageJson from "../../package.json";

const main = async () => {
    const program = new Command();

    program.name(packageJson.name).version(packageJson.version).description(packageJson.description);

    program.option("--config", "The path the config file.", defaultCliOptions.config);
    program.option(
        "--dry-run",
        "If true, wersion will not make any git changes. Like that you can test the outcome of wersion.",
        defaultCliOptions.dryRun,
    );
    program.option(
        "--releaseAs <releaseType>",
        "Set the release type manually. Creates a new tag and release commit of given type.",
    );

    program.parse();

    const options = program.opts();
    config.loadConfigFile(options.config);
    config.set(options);

    try {
        const action = new DefaultAction();
        await action.run();
    } catch (e) {
        console.error(e);
    }
};

main().then(() => process.exit());
