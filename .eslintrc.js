module.exports = {
  plugins: ['security'],
  extends: ['prettier', 'plugin:security/recommended'],
  parserOptions: {
    project: 'tsconfig.json',
    ecmaVersion: 2017,
    sourceType: "module"
  },
  parser: '@typescript-eslint/parser',
};
