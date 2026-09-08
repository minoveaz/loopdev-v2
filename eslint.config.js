import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Rivera radius system — disallow oversized Tailwind radius utilities.
      // Cards/dialogs/dropdowns cap at rounded-xl. rounded-2xl / rounded-3xl
      // are not part of the design system and must not be reintroduced.
      // (rounded-full is allowed for avatars, status dots, switches, etc.)
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/(?:^|\\s)rounded-(?:2xl|3xl)(?:\\s|$)/]",
          message:
            "Avoid rounded-2xl / rounded-3xl. Use rounded-xl for cards/dialogs and rounded-lg or rounded-md for controls. If absolutely required, add // eslint-disable-next-line no-restricted-syntax with a justification.",
        },
        {
          selector: "TemplateElement[value.raw=/(?:^|\\s)rounded-(?:2xl|3xl)(?:\\s|$)/]",
          message:
            "Avoid rounded-2xl / rounded-3xl. Use rounded-xl for cards/dialogs and rounded-lg or rounded-md for controls.",
        },
      ],
    },
  },
);
