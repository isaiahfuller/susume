import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import ts from "@typescript-eslint/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default defineConfig([
  {
    ignores: ["dist/**"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...ts.configs["flat/recommended"],
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-refresh/only-export-components": "warn",
      "no-unused-vars": "off",
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);
