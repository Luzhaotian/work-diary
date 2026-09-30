import js from "@eslint/js"
import pluginVue from "eslint-plugin-vue"
import vueParser from "vue-eslint-parser"
import tsparser from "@typescript-eslint/parser"
import tseslint from "@typescript-eslint/eslint-plugin"
import prettier from "eslint-plugin-prettier"

const commonGlobals = {
  uni: "readonly",
  wx: "readonly",
  console: "readonly",
  Event: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  // H5 端（record.vue 导出 CSV 的 #ifndef MP-WEIXIN 分支）会用到浏览器全局
  document: "readonly",
  window: "readonly",
  navigator: "readonly",
  Blob: "readonly",
  URL: "readonly",
  globalThis: "readonly",
}

export default [
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: commonGlobals,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      // 基础规则不认识 TS 类型位置的参数（如接口里的 (e: Event) => void），
      // 交给 @typescript-eslint 版本处理，避免重复报错
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
      "vue/html-self-closing": [
        "error",
        {
          html: { void: "always", normal: "never", component: "always" },
          svg: "always",
          math: "always",
        },
      ],
      "vue/singleline-html-element-content-newline": "off",
      "vue/multiline-html-element-content-newline": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-indent": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: commonGlobals,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      prettier,
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "*.config.js"],
  },
]
