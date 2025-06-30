import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-plugin-prettier/recommended";
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";

export default [
    jsdoc.configs["flat/recommended-typescript"],
    prettier,
    eslint.configs.recommended,
    ...tsEslint.configs.recommended,
    {
        files: ["**/*.ts", "**/*.tsx"],
    },
    {
        ignores: ["**/node_modules", "**/dist", "**/build", "**/out", "**/gql", "**/*js"],
    },
    {
        languageOptions: {
            globals: {
                amd: true,
                node: true,
                module: true,
            },
            parserOptions: {
                warnOnUnsupportedTypeScriptVersion: false,
            },
        },
        rules: {
            "jsdoc/require-param": ["off"],
            "jsdoc/require-returns": ["off"],
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
];
