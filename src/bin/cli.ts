import { Command } from "commander";
import { DefaultWorkflowClass } from "./default-workflow.class";

const main = async () => {
    const packageJson = require("../../package.json");

    const program = new Command();

    program.name(packageJson.name).version(packageJson.version).description(packageJson.description);

    program.option("--releaseAs <releaseType>");

    program.parse();

    const workflow = new DefaultWorkflowClass();
    await workflow.run();
};

main().then(() => process.exit());
