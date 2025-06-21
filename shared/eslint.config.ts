import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = import.meta.dirname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },

    extends: compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier'
    ),

    plugins: {
      prettier,
    },

    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'off',
      'no-debugger': 'error',
    },
  },
  globalIgnores(['**/dist', '**/.eslintrc.js']),
  globalIgnores(['node_modules/', 'dist/', 'pnpm-lock.yaml', '*.d.ts']),
]);
