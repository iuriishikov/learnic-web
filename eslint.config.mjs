import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // `console.log` / `console.warn` / `console.debug` are noise in
    // production bundles and almost always leftover debugging. Allow
    // `console.error` for actual error logging (in addition to the
    // structured logger when one ships). Override per-file if a
    // tooling script genuinely needs raw stdout.
    rules: {
      "no-console": [
        "warn",
        { allow: ["error"] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
