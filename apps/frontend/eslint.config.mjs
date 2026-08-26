import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

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
  { ignores: ["eslint.config.mjs", "next.config.ts", "node_modules", ".next"] },
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
      "import-x/resolver": { typescript: {} },
      // eslint-plugin-boundaries resolves module paths via the classic "import/resolver"
      // settings key (not "import-x/resolver"), even though import-x is used for the rest.
      "import/resolver": { typescript: {} },
      // Pinned rather than "detect": react-version auto-detection calls the removed
      // `context.getFilename()` API and crashes under ESLint 10 (see also the
      // react/jsx-filename-extension etc. notes below).
      react: { version: "19.2" },
      "boundaries/elements": [
        { type: "app", pattern: "src/app/*" },
        // Next.js App Router itself lives at the project root, outside `src/`, so that it
        // never shadows the FSD "pages" layer (see pages/README.md for why). It's still the
        // FSD "app" layer, just a second location.
        { type: "app", pattern: "app/*" },
        { type: "pages", pattern: "src/pages/*" },
        { type: "widgets", pattern: "src/widgets/*" },
        { type: "features", pattern: "src/features/*" },
        { type: "entities", pattern: "src/entities/*" },
        { type: "shared", pattern: "src/shared/*" },
      ],
    },

    rules: {
      // TypeScript rules are applied only to TS files via override below

      // --- FSD layer boundaries ---
      // Valid import chain (per README): app -> pages -> widgets -> features -> entities -> shared.
      // A layer may only import from layers strictly below it in that chain.
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: [
                { to: { element: { type: "pages" } } },
                { to: { element: { type: "widgets" } } },
                { to: { element: { type: "features" } } },
                { to: { element: { type: "entities" } } },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "pages" } },
              allow: [
                { to: { element: { type: "widgets" } } },
                { to: { element: { type: "features" } } },
                { to: { element: { type: "entities" } } },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "widgets" } },
              allow: [
                { to: { element: { type: "features" } } },
                { to: { element: { type: "entities" } } },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "features" } },
              allow: [
                { to: { element: { type: "entities" } } },
                { to: { element: { type: "shared" } } },
              ],
            },
            {
              from: { element: { type: "entities" } },
              allow: [{ to: { element: { type: "shared" } } }],
            },
          ],
        },
      ],

      // --- Import sorting / restrictions (unchanged) ---
      "simple-import-sort/imports": "off",
      "no-duplicate-imports": ["error"],
      // "no-restricted-imports": ["error", { patterns: ["**/internal/**"] }],
      // "no-restricted-exports": ["error", { restrictDefaultExports: { direct: true } }],

      // --- Non-formatting core rules (unchanged) ---
      "no-magic-numbers": ["error", { ignore: [0] }],
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
      "capitalized-comments": [
        "error",
        "always",
        { ignoreInlineComments: true, ignoreConsecutiveComments: true },
      ],
      "multiline-ternary": ["error", "always-multiline"],
      "no-tabs": ["error", { allowIndentationTabs: true }],
      semi: ["error", "always"],
      indent: ["error", 2, { SwitchCase: 1 }],
      "react/jsx-indent": ["error", 2],
      "react/jsx-indent-props": ["error", 2],
      "comma-spacing": ["error", { before: false, after: true }],
      "semi-spacing": ["error", { before: false, after: true }],
      "no-multi-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      "object-curly-newline": ["error", { multiline: true }],
      "array-bracket-newline": ["error", { multiline: true }],
      "space-in-parens": ["error", "never"],
      "key-spacing": ["error", { beforeColon: false }],
      "space-infix-ops": ["error", { int32Hint: false }],
      "space-unary-ops": [1, { words: true, nonwords: false, overrides: { new: false } }],
      "no-trailing-spaces": "error",
      "arrow-spacing": "error",
      quotes: ["error", "double"],
      "lines-between-class-members": ["error", "always"],
      "padded-blocks": ["error", { classes: "always" }],
      "no-multiple-empty-lines": ["error", { max: 1 }],
      "max-len": ["error", { code: 130 }],
      "comma-dangle": ["error", "always-multiline"],
      "brace-style": "error",
      "space-before-blocks": ["error", "always"],
      "keyword-spacing": ["error", { overrides: { return: { after: true } } }],
      // "lines-around-comment" is intentionally NOT enabled here: eslint-config-prettier turns
      // it off (see its README's "special rules" list) because Prettier always strips the blank
      // line right after an opening brace/interface body/etc., while this rule's
      // `beforeBlockComment` would require one there. Its `allowBlockStart`-family options only
      // recognize native ES node types (BlockStatement, ObjectExpression, ClassBody, ...), not
      // TS-only nodes like TSInterfaceBody - which is exactly the `interface X { /** doc */ ... }`
      // shape used throughout this codebase - so re-enabling this rule (even tuned) means
      // `eslint --fix` and `prettier --write` fight over the same blank line forever.
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: "import", next: "block-like" },
        { blankLine: "always", prev: "import", next: "class" },
        { blankLine: "always", prev: "import", next: "const" },
      ],

      // React rules moved into JSX/TSX override to avoid running on plain .ts/.js files

      // --- jsdoc (unchanged) ---
      "jsdoc/check-alignment": "error",
      "jsdoc/check-indentation": ["error"],
      "jsdoc/no-blank-blocks": ["error", { enableFixer: false }],
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
      // React 17+ automatic JSX runtime (used by Next.js) never requires `React` in scope.
      "react/react-in-jsx-scope": "off",
      // TypeScript prop types make PropTypes declarations redundant.
      "react/prop-types": "off",
      // Disabled: these rules still call APIs removed in ESLint 10
      // (`context.getFilename()` / `sourceCode.isSpaceBetweenTokens()`) and crash the linter.
      // eslint-plugin-react@7.37.5 (latest as of writing) has no ESLint-10-compatible release yet.
      "react/jsx-filename-extension": "off",
      "react/jsx-tag-spacing": "off",
      "react/jsx-curly-spacing": "off",
      "react/jsx-one-expression-per-line": "off",
      "react/no-unknown-property": "error",
      "react/self-closing-comp": "error",
      // `when: "multiline"` - without it this rule caps props-per-line even on JSX Prettier
      // keeps on one line (it fits `max-len`), so `eslint --fix` would force a wrap that
      // `prettier --write` immediately collapses again. Same class of fight as the
      // "lines-around-comment" note above: only enforce 1-per-line once something (Prettier's
      // own printWidth wrapping, or a manual line break) has already made the element multiline.
      "react/jsx-max-props-per-line": ["error", { maximum: 1, when: "multiline" }],
      "react/jsx-closing-bracket-location": [1, "tag-aligned"],
      "react/jsx-first-prop-new-line": [2, "multiline-multiprop"],
      "react/jsx-wrap-multilines": ["error", { return: "parens-new-line" }],
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
    rules: { "filenames/match-regex": "off" },
  },
  // Next.js App Router special files (page/layout/loading/error/...) must use a default
  // export - that's a framework requirement, not a style choice, so it's exempted here.
  {
    files: [
      "app/**/{page,layout,loading,error,not-found,template,default,global-error}.tsx",
      "app/**/route.ts",
    ],
    rules: { "no-restricted-exports": "off" },
  },
  {
    files: ["**/*.{ts,js,jsx}"],
    ignores: ["**/*.d.ts"],
    rules: { "filenames/match-regex": "off" },
  },
);
