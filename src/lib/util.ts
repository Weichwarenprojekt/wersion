import { createLogger, format, transports } from "winston";
import figures from "figures";
import chalk from "chalk";
import { CommitParser } from "conventional-commits-parser";

const { combine, printf } = format;

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

/**
 * The commit parser
 */
export const commitParser = new CommitParser({
    headerPattern: /^(\w*)(?:\((.*)\))?!?: (.*)$/,
});
