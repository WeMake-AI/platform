import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        // Cloudflare Workers globals
        crypto: "readonly",
        console: "readonly",
        fetch: "readonly",
        Response: "readonly",
        Request: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        D1Database: "readonly",
        KVNamespace: "readonly",
        addEventListener: "readonly",
        self: "readonly",
        caches: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      // Custom rules for Cloudflare Workers
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "no-console": "off", // Allow console in workers for logging
      "prefer-const": "error",
      "no-var": "error"
    }
  },

  // Prettier configuration (must be last)
  prettier,

  // Ignore patterns
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "*.config.js",
      "wrangler.toml",
      "*.d.ts"
    ]
  }
];
