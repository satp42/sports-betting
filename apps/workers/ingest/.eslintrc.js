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
    jest: true,
  },
  ignorePatterns: ['dist/', 'node_modules/', '**/*.d.ts'],
  rules: {
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
  },
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      rules: {
        'no-undef': 'off', // TypeScript handles this
      },
    },
    {
      files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      env: {
        jest: true,
      },
      globals: {
        'jest': 'readonly',
        'describe': 'readonly',
        'it': 'readonly',
        'expect': 'readonly',
        'beforeEach': 'readonly',
        'afterEach': 'readonly',
        'beforeAll': 'readonly',
        'afterAll': 'readonly',
      },
      rules: {
        'no-unused-vars': 'off', // Allow unused vars in tests
        'no-undef': 'off', // TypeScript handles this
      },
    },
  ],
}; 