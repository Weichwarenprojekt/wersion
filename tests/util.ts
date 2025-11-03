import { Volume } from "memfs";
import { config } from "../src/lib/config";

/**
 * Returns a file from a memfs volume
 */
export const getMockFile = (vol: Volume, name: string) => {
    const json = vol.toJSON();
    for (const key in json) {
        if (key.endsWith(name)) {
            return json[key];
        }
    }
};

/**
 * Resets the config to the default values
 */
export const resetMockConfig = () => {
    // @ts-expect-error This is a private function, but it is there
    config.reset();
};
