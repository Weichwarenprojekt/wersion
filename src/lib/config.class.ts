import * as path from "node:path";
import * as fse from "fs-extra";
import { ConfigModel } from "../models/config";

export const configFileName = ".wersionrc.json";

export class Config {
    private static instance: Config = null;

    private configStore: Partial<ConfigModel> = {};

    static getInstance() {
        return this.instance ?? (this.instance = new Config());
    }

    constructor() {
        this.loadConfigFile();
    }

    private loadConfigFile() {
        const configFilePath = path.resolve(process.cwd(), configFileName);
        this.configStore = fse.readJsonSync(configFilePath);
    }

    get config(): Partial<ConfigModel> {
        return this.configStore;
    }
}
