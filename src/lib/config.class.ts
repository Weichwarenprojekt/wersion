import path from "node:path";
import { ConfigModel } from "../models/config";
import fs from "fs";

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

    public loadConfigFile() {
        const configFilePath = path.resolve(process.cwd(), configFileName);
        this.configStore = JSON.parse(fs.readFileSync(configFilePath).toString());
    }

    get config(): Partial<ConfigModel> {
        return this.configStore;
    }
}
