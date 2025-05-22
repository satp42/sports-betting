module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: ['dist/', 'node_modules/'],
  rules: {
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
}; 