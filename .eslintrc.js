module.exports = {
  plugins: ['security'],
  extends: ['prettier', 'plugin:security/recommended'],
  parserOptions: {
    project: 'tsconfig.json',
  },
  parser: '@typescript-eslint/parser',
};
