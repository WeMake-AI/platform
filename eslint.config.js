import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";
import prettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Base JavaScript configuration
  js.configs.recommended,

  // TypeScript configuration (non-type-checked)
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      // TypeScript recommended rules (non-type-checked)
      ...tseslint.configs.recommended.rules,

      // Custom rules aligned with project standards
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true
        }
      ],

      // General code quality rules
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "prefer-template": "error"
    }
  },

  // Astro configuration
  ...astro.configs.recommended,
  {
    files: ["**/*.astro"],
    rules: {
      // Astro-specific rules
      "astro/no-conflict-set-directives": "error",
      "astro/no-unused-define-vars-in-style": "error"
    }
  },

  // TypeScript configuration (type-checked for source files only)
  {
    files: [
      "src/*/src/**/*.ts",
      "src/*/src/**/*.tsx",
      "src/**/*.ts",
      "src/**/*.tsx"
    ],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json", "./src/*/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@typescript-eslint": tseslint
    },
    rules: {
      // TypeScript type-checked rules for source files
      ...tseslint.configs["recommended-type-checked"].rules
    }
  },

  // Configuration files
  {
    files: ["**/*.config.{js,mjs,cjs,ts}", "**/.*rc.{js,mjs,cjs}"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "no-console": "off"
    }
  },

  // Worker configuration files (generated)
  {
    files: ["**/worker-configuration.d.ts"],
    rules: {
      // Disable all rules for generated files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-types": "off"
    }
  },

  // Test files
  {
    files: ["**/*.test.{js,ts,tsx}", "**/*.spec.{js,ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off"
    }
  },

  // Prettier compatibility (must be last)
  prettier,

  // Global ignores
  {
    ignores: [
      "**/.astro/**",
      "**/.wrangler/**",
      "**/dist/**",
      "**/build/**",
      "node_modules/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.min.js",
      "bun.lock",
      "worker-configuration.d.ts"
    ]
  }
];
