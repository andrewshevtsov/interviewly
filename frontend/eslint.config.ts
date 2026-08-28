import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import fsdPlugin from "eslint-plugin-fsd-lint";

interface FsdAlias {
  value: string;
  withSlash?: boolean;
}

interface FsdOptions {
  rootPath: string;
  alias: FsdAlias;
  tsconfigPath: string;
  allowSameSlice?: boolean;
}

const fsdOptions: FsdOptions = {
  rootPath: "/src/",
  alias: {
    value: "@",
    withSlash: false,
  },
  tsconfigPath: "./tsconfig.json",
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: {
      fsd: fsdPlugin,
    },
    rules: {
      "fsd/forbidden-imports": ["error", fsdOptions],
      "fsd/no-cross-slice-dependency": ["error", fsdOptions],
      "fsd/no-public-api-sidestep": ["error", fsdOptions],
      "fsd/no-relative-imports": [
        "error",
        { ...fsdOptions, allowSameSlice: true },
      ],
      "fsd/no-global-store-imports": "error",
      "fsd/no-ui-in-business-logic": ["error", fsdOptions],
      "fsd/ordered-imports": ["warn", fsdOptions],
    },
  },
]);
