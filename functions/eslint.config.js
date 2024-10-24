// eslint.config.js
module.exports = [
  {
    ignores: ['node_modules/**'],
  },
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        // Specify your environment globals (if needed)
        console: 'readonly',
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn', // Customize your linting rules here
      'no-console': 'off',
    },
  },
];
