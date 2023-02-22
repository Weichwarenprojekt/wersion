import path from "node:path";
import { ConfigModel } from "../models/config";
import fs from "fs";
import { CliOptions } from "../models/cli-options";
import _ from "lodash";

export const configFileName = ".wersionrc.json";

export class Config {
    private static instance: Config = null;

    private configStore: Partial<ConfigModel & CliOptions> = {};

    static getInstance() {
        return this.instance ?? (this.instance = new Config());
    }

    constructor() {
        this.loadConfigFile();
    }

    public loadConfigFile() {
        const configFilePath = path.resolve(process.cwd(), configFileName);

        fs.statSync(configFilePath, { throwIfNoEntry: false });

        if (fs.statSync(configFilePath, { throwIfNoEntry: false })?.isFile()) {
            const configFileContent = fs.readFileSync(configFilePath)?.toString();
            this.configStore = JSON.parse(configFileContent);
        }
    }

    get config(): Partial<ConfigModel & CliOptions> {
        return this.configStore;
    }

    public set(config: Partial<ConfigModel & CliOptions>) {
        this.configStore = _.merge(this.configStore, config);
    }
}
