import path from "node:path";
import { defaultWersionConfig, WersionConfigModel } from "../models/wersion-config.model";
import { CliOptionsModel, defaultCliOptions } from "../models/cli-options.model";
import _ from "lodash";
import { loadModule } from "@weichwarenprojekt/ts-importer";

/**
 * The config store contains the wersion config and the cli config
 */
type ConfigStoreModel = WersionConfigModel & CliOptionsModel;

/**
 * The configuration management class
 */
class Config {
    /** The actual configuration */
    private configStore: ConfigStoreModel = _.merge(defaultWersionConfig, defaultCliOptions);

    /**
     * Load the configuration file from the given path
     */
    public loadConfigFile(configPath: string) {
        try {
            const config = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
            const configImport = loadModule<{ configuration: WersionConfigModel }>(config);
            if (!configImport.configuration)
                console.warn('The specified configuration does not export a "configuration"');
            this.set(configImport.configuration);
        } catch (e) {
            console.log(e);
            console.warn("Could not find a configuration file!");
        }
    }

    /**
     * Getter for the config
     */
    get config(): ConfigStoreModel {
        return this.configStore;
    }

    /**
     * Setter for the config
     */
    public set(config: Partial<ConfigStoreModel>) {
        this.configStore = _.merge(this.configStore, config);
    }
}

/**
 * The singleton instance of the configuration
 */
export const config = new Config();
