// eslint-disable-next-line @typescript-eslint/no-var-requires
const { baseConfig } = require("@weichwarenprojekt/configuration").ESLintConfiguration;

module.exports = {
    ...baseConfig,
    env: {
        node: true,
        es2021: true,
    },
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "prettier"],
};
