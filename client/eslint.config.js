import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import reactRefresh from "eslint-plugin-react-refresh";
import eslint from "@eslint/js";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReactConfig,
  {
    settings: { react: { version: "detect" } },
    plugins: {
      "react-refresh": reactRefresh,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react-refresh/only-export-components": "warn",
    },
  },
];

