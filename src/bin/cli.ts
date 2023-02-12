import { Command } from "commander";
import { DefaultAction } from "./default-action.class";

const main = async () => {
    const packageJson = require("../../package.json");

    const program = new Command();

    program.name(packageJson.name).version(packageJson.version).description(packageJson.description);

    program.option("--releaseAs <releaseType>");

    program.parse();

    const workflow = new DefaultAction();
    await workflow.run();
};

main().then(() => process.exit());
