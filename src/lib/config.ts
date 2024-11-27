import path from "node:path";
import { defaultWersionConfig, WersionConfigModel } from "../models/wersion-config.model";
import { CliOptionsModel, defaultCliOptions } from "../models/cli-options.model";
import _ from "lodash";
import { loadModule } from "@weichwarenprojekt/ts-importer";
import { logger } from "./util";
import fs from "fs";

/**
 * The config store contains the wersion config and the cli config
 */
type ConfigStoreModel = WersionConfigModel & CliOptionsModel;

/**
 * The configuration management class
 */
class Config {
    /** The actual configuration */
    private configStore: ConfigStoreModel = _.merge({}, defaultWersionConfig, defaultCliOptions);

    /**
     * Load the configuration file from the given path
     */
    public loadConfigFile(configPath: string) {
        try {
            let config = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath);
            if (!fs.existsSync(config)) {
                config = config.replace(".ts", ".mts");
                if (!fs.existsSync(config)) {
                    logger.warn("Could not find a configuration file!");
                    return;
                }
            }
            const configImport = loadModule<{ configuration: WersionConfigModel }>(config);
            if (!configImport.configuration)
                logger.warn('The specified configuration does not export a "configuration"');
            this.set(configImport.configuration);
        } catch (e) {
            logger.error(
                `Could not parse the configuration file! Ensure, that the configuration does not import ESM modules.`,
            );
            throw e;
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
        this.configStore = _.mergeWith(this.configStore, config, (objValue, srcValue) => {
            if (objValue === undefined) return srcValue;
        });
    }
}

/**
 * The singleton instance of the configuration
 */
export const config = new Config();
