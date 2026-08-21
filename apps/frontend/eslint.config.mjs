
import {fileURLToPath} from "node:url";
import {dirname} from "node:path";

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import stylistic from "@stylistic/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
// eslint-plugin-import's flat-config resolver support is unreliable; import-x is its
// flat-config-native successor and keeps the same rule set (just under `import-x/`).
import importX from "eslint-plugin-import-x";
import boundaries from "eslint-plugin-boundaries";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import filenames from "eslint-plugin-filenames";
import prettierConfig from "eslint-config-prettier";

const baseDirectory = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  // --- Base rule sets (each already ships a flat config, no FlatCompat needed) ---
    { ignores: ['eslint.config.mjs', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  jsdoc.configs["flat/recommended"],
  prettierConfig,

  // --- Project-wide settings + custom rules ---
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
      },
    },

    plugins: {
      stylistic,
      react: reactPlugin,
      jsdoc,
      boundaries,
      "simple-import-sort": simpleImportSort,
      filenames,
    },

    settings: {
      "import-x/resolver": {typescript: {}},
      react: {version: "detect"},
      boundaries: {
        default: "disallow",
        rules: [
          {
            from: ["app", "pages", "features", "widgets", "entities", "shared"],
            allow: ["shared", "entities", "public-api"],
          },
        ],
      },
    },

    rules: {
      // TypeScript rules are applied only to TS files via override below

      // --- Import sorting / restrictions (unchanged) ---
      "simple-import-sort/imports": "off",
      "no-duplicate-imports": ["error"],
      "no-restricted-imports": ["error", {patterns: ["**/internal/**"]}],
      "no-restricted-exports": ["error", {restrictDefaultExports: {direct: true}}],

      // --- Non-formatting core rules (unchanged) ---
      "no-magic-numbers": ["error", {ignore: [0]}],
      "no-console": "error",
      "max-lines": ["error", 3000],
      "max-params": ["error", 7],
      curly: "error",
      "no-mixed-operators": "error",
      eqeqeq: "error",
      "dot-notation": ["off"],
      "no-var": "error",
      "prefer-const": "error",
      "object-shorthand": ["error", "always"],

      // --- Formatting/layout rules (core + react) ---
      "eol-last": ["error", "always"],
      "capitalized-comments": ["error", "always", {ignoreInlineComments: true, ignoreConsecutiveComments: true}],
      "multiline-ternary": ["error", "always-multiline"],
      "no-tabs": ["error", {allowIndentationTabs: true}],
      "semi": ["error", "always"],
      "indent": ["error", 2, {SwitchCase: 1}],
      "react/jsx-indent": ["error", 2],
      "react/jsx-indent-props": ["error", 2],
      "comma-spacing": ["error", {before: false, after: true}],
      "semi-spacing": ["error", {before: false, after: true}],
      "no-multi-spaces": "error",
      "object-curly-spacing": ["error", "never"],
      "object-curly-newline": ["error", {multiline: true}],
      "array-bracket-newline": ["error", {multiline: true}],
      "space-in-parens": ["error", "never"],
      "key-spacing": ["error", {beforeColon: false}],
      "space-infix-ops": ["error", {int32Hint: false}],
      "space-unary-ops": [
        1,
        {words: true, nonwords: false, overrides: {new: false}},
      ],
      "no-trailing-spaces": "error",
      "arrow-spacing": "error",
      "quotes": ["error", "double"],
      "lines-between-class-members": ["error", "always"],
      "padded-blocks": ["error", {classes: "always"}],
      "no-multiple-empty-lines": ["error", {max: 1}],
      "max-len": ["error", {code: 130}],
      "comma-dangle": ["error", "always-multiline"],
      "brace-style": "error",
      "space-before-blocks": ["error", "always"],
      "keyword-spacing": ["error", {overrides: {return: {after: true}}}],
      "lines-around-comment": ["error", {afterBlockComment: false, beforeBlockComment: true}],
      "padding-line-between-statements": [
        "error",
        {blankLine: "always", prev: "*", next: "return"},
        {blankLine: "always", prev: "import", next: "block-like"},
        {blankLine: "always", prev: "import", next: "class"},
        {blankLine: "always", prev: "import", next: "const"},
      ],

      // React rules moved into JSX/TSX override to avoid running on plain .ts/.js files

      // --- jsdoc (unchanged) ---
      "jsdoc/check-alignment": "error",
      "jsdoc/check-indentation": ["error"],
      "jsdoc/no-blank-blocks": ["error", {enableFixer: false}],
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            MethodDefinition: true,
            ClassDeclaration: true,
            ClassExpression: true,
          },
          checkConstructors: false,
          checkSetters: true,
          contexts: [
            "TSEnumDeclaration",
            "TSInterfaceDeclaration",
            "TSPropertySignature",
            "ArrowFunctionExpression",
            "TSMethodSignature",
            "PropertyDefinition",
          ],
        },
      ],
    },
  },

  // --- Per-file overrides (replaces `overrides:` array) ---
  // React rules only for JSX/TSX files to avoid running react-plugin on plain TS/JS
  {
    files: ["**/*.{jsx,tsx}"],
    ...reactPlugin.configs.flat.recommended,
    rules: {
      "react/jsx-key": "error",
      "react/jsx-no-duplicate-props": "error",
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "react/jsx-filename-extension": ["warn", {extensions: [".tsx"]}],
      "react/no-unknown-property": "error",
      "react/self-closing-comp": "error",
      "react/jsx-tag-spacing": [
        "error",
        {
          beforeClosing: "never",
          beforeSelfClosing: "always",
          afterOpening: "never",
          closingSlash: "never",
        },
      ],
      "react/jsx-curly-spacing": "error",
      "react/jsx-max-props-per-line": ["error", {maximum: 1}],
      "react/jsx-closing-bracket-location": [1, "tag-aligned"],
      "react/jsx-first-prop-new-line": [2, "multiline-multiprop"],
      "react/jsx-wrap-multilines": ["error", {return: "parens-new-line"}],
      "react/jsx-one-expression-per-line": "error",
    },
  },
  // Type-aware rules only for TypeScript files (prevents eslint.config.mjs being required in tsconfig)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: baseDirectory,
      },
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-use-before-define": ["error"],
      "@typescript-eslint/no-shadow": ["error"],
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/member-ordering": [
        "error",
        {
          default: [
            "public-field",
            "protected-field",
            "private-field",
            "constructor",
            "public-method",
            "protected-method",
            "private-method",
          ],
        },
      ],
      "@typescript-eslint/explicit-member-accessibility": [
        "error",
        {
          accessibility: "explicit",
          overrides: {
            accessors: "explicit",
            constructors: "no-public",
            methods: "explicit",
            properties: "explicit",
            parameterProperties: "explicit",
          },
        },
      ],
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          modifiers: ["const"],
          types: ["boolean", "string", "number"],
          format: ["UPPER_CASE"],
        },
        {
          selector: "variableLike",
          format: ["camelCase", "PascalCase", "UPPER_CASE"],
        },
      ],
    },
  },
  {
    files: ["**/*.tsx"],
    rules: {"filenames/match-regex": "off"},
  },
  {
    files: ["**/*.{ts,js,jsx}"],
    ignores: ["**/*.d.ts"],
    rules: {"filenames/match-regex": "off"},
  },
);
