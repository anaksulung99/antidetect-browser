// @ts-check
import pluginVue from "eslint-plugin-vue";
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import vueParser from "vue-eslint-parser";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import globals from "globals";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const autoImportPath = path.join(__dirname, ".eslintrc-auto-import.json");
const autoImportConfig = fs.existsSync(autoImportPath)
  ? JSON.parse(fs.readFileSync(autoImportPath, "utf-8"))
  : { globals: {} };

const config: unknown[] = [
  {
    ignores: [
      "dist/**",
      "dist-electron/**",
      "node_modules/**",
      "src/components/ui/**",
      "src/auto-imports.d.ts",
      "src/components.d.ts",
    ],
  },
  {
    files: ["src/**/*.{js,ts,vue}"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: "@vue/eslint-config-typescript/parser",
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.browser,
        ...autoImportConfig.globals, // Global dari ref, computed, vue-router, dll.
      },
    },
    plugins: {
      vue: pluginVue,
    },
    rules: {
      // Masukkan aturan Vue & TS khusus frontend disini jika diperlukan
    },
  },
  {
    files: ["electron/**/*.{js,ts,cjs,mjs}"],
    languageOptions: {
      parser: typescriptParserShim(), // Parser TS untuk file TS backend
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
      globals: {
        ...globals.node,
        // Globals khusus preload / browser context di electron
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
      },
    },
    rules: {
      // Matikan aturan spesifik Vue untuk file electron backend
      "vue/multi-word-component-names": "off",
    },
  },
  ...pluginVue.configs["flat/recommended"],
  ...vueTsEslintConfig(),
  eslintConfigPrettier,
  {
    rules: {
      // Component naming & Vue rules
      "vue/multi-word-component-names": "off",
      "vue/unused-vars": "off",
      "vue/no-unused-vars": "off",
      "vue/require-default-prop": "off",
      "vue/require-explicit-emits": "off",
      // TypeScript & Unused Variables
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "vue/no-mutating-props": "off",
    },
  },
];

export default config;

function typescriptParserShim() {
  const tsConfig = vueTsEslintConfig();
  const parser = tsConfig.find((c) => c.languageOptions?.parser)
    ?.languageOptions?.parser;
  return parser || "@typescript-eslint/parser";
}
