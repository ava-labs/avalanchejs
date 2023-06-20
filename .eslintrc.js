module.exports = {
  plugins: ["security"],
  extends: ["prettier", "plugin:security/recommended"],
  parserOptions: {
    project: "tsconfig.json",
    ecmaVersion: 2017,
    sourceType: "module"
  },
  parser: "@typescript-eslint/parser",
  ignorePatterns: [
    "**/*/*.d.ts",
    "**/*/*.test.ts",
    "e2etestlib.ts",
    "__mocks__"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off"
  }
}
