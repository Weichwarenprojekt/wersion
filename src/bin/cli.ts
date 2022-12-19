import { Command } from "commander";
import { DefaultWorkflowClass } from "./default-workflow.class";

const main = async () => {
    const program = new Command();

    program.parse();

    const workflow = new DefaultWorkflowClass();
    await workflow.run();
};

main().then(() => process.exit());
