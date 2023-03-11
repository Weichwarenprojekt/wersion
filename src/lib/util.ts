import { createLogger, format, transports } from "winston";
import figures from "figures";
import chalk from "chalk";

const { combine, printf } = format;

/**
 * Regex to fetch commit type scope and message from a conventional commit
 */
export const conventionalCommitRegex = /([a-z]*)(\(([a-z\-]*)\))?:\s(.*)/;

/**
 * The colors for the logger
 */
const colors: { [key: string]: string } = {
    info: chalk.green(figures.tick),
    warn: chalk.yellow(figures.warning),
    error: chalk.red(figures.cross),
};

/**
 * The pino logger
 */
export const logger = createLogger({
    transports: new transports.Console({
        level: "info",
        format: combine(printf((info) => `${colors[info.level]} ${info.message}`)),
    }),
});
