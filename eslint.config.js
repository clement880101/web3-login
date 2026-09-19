import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['build/', 'dist/', 'coverage/', 'node_modules/'] },

  js.configs.recommended,
  reactHooks.configs.flat['recommended-latest'],

  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'object-shorthand': 'error',
    },
  },

  // Tests and setup run under Vitest with jsdom plus Node globals.
  {
    files: [
      '**/__tests__/**',
      '**/*.test.{js,jsx}',
      'src/setupTests.js',
      'src/lib/testUtils/**',
    ],
    languageOptions: { globals: { ...globals.node, ...globals.vitest } },
    rules: { 'no-console': 'off' },
  },

  // Build configs and build-time scripts are Node modules, not browser code.
  {
    files: ['*.config.js', 'scripts/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },

  prettier,
];
