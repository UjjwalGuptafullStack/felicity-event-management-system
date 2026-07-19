import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // The new JSX transform (React 17+) never requires importing React,
      // and this project doesn't do so — these two rules from
      // react.configs.flat.recommended would otherwise false-positive.
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Not using PropTypes in this codebase; would flag every component.
      'react/prop-types': 'off',
      // Pedantic for a codebase with plenty of pre-existing apostrophes/quotes
      // in JSX text content; not worth the churn to escape retroactively.
      'react/no-unescaped-entities': 'off',
    },
  },
])
