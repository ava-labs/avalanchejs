module.exports = {
  extends: ['airbnb-typescript/base'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
// use @typescript-eslint/no-unused-vars instead
'no-unused-vars': 'off',
'max-classes-per-file': 'off',
'no-underscore-dangle': 'off',
// enable for-in and for-of
'no-restricted-syntax': [
  'error',
  {
    selector: 'LabeledStatement',
    message:
      'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
  },
  {
    selector: 'WithStatement',
    message:
      '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
  },
],
'max-len': ["error", { "code": 175, "ignoreComments": true }],
'no-param-reassign': 'off',
    'react/state-in-constructor': 'off',
    'react/prop-types': 'off',
    'class-methods-use-this': 'off',
    'no-await-in-loop': 'warn',
    'no-continue': 'off',
    'no-console': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': ['error', { allow: ['arrowFunctions'] }],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    'no-plusplus': 'off',
    'import/extensions': [
      'error',
      'always',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
    'guard-for-in': 'off',
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': ['error'],
    '@typescript-eslint/no-use-before-define':'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'import/no-cycle': 'off'
  }
};
