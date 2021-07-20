module.exports = {
  // plugins: ['security'],
  //  extends: ['prettier', 'plugin:security/recommended'],
  extends: ['prettier'],
  parserOptions: {
    project: 'tsconfig.json',
  },
  parser: '@typescript-eslint/parser',
};
