#!/usr/bin/env node

import { Command } from "commander";
import { DefaultAction } from "./default-action.class";

const main = async () => {
    const packageJson = require("../../package.json");

    const program = new Command();

    program.name(packageJson.name).version(packageJson.version).description(packageJson.description);

    program.option(
        "--releaseAs <releaseType>",
        "Set the release type manually. Creates a new tag and release commit of given type.",
    );
    program.option(
        "--dry-run",
        "Flag for testing the outcome of wersion. This will cause in not affecting any file or your git history.",
    );

    program.parse();

    try {
        const workflow = new DefaultAction();
        await workflow.run(program.opts());
    } catch (e) {
        console.error(e.message);
    }
};

main().then(() => process.exit());
