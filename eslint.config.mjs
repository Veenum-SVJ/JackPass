/**
 * ESLint flat config for Next.js 15 with TypeScript
 * This is a manual flat config that replicates the Next.js recommended config
 * without relying on the legacy eslint-config-next package.
 */
import pluginNext from "@next/eslint-plugin-next";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import pluginImport from "eslint-plugin-import";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": pluginNext,
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
      import: pluginImport,
    },
    settings: {
      react: {
        version: "18.3",
      },
      "import/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      // Next.js specific rules
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
      
      // React rules
      ...pluginReact.configs.recommended.rules,
      ...pluginReact.configs["jsx-runtime"].rules,
      
      // React hooks rules
      ...pluginReactHooks.configs.recommended.rules,
      
      // JSX A11y rules
      ...pluginJsxA11y.configs.recommended.rules,
      
      // Import rules
      ...pluginImport.configs.recommended.rules,
      ...pluginImport.configs.typescript.rules,
      
      // TypeScript ESLint rules (from tseslint.configs.recommended)
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      
      // Relax some rules for development
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
    },
  },
  {
    // Override for test files if any
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);