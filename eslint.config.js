import { defineFlatConfig } from 'eslint-define-config'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default defineFlatConfig({
  languageOptions: {
    parser: typescriptParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: './tsconfig.json',
    },
  },
  plugins: {
    '@typescript-eslint': typescriptEslint,
  },
  rules: {
    // 自定义规则
    'prettier/prettier': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  },
  // 扩展Prettier规则
  extends: [
    eslintPluginPrettierRecommended,
  ],
  files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
})
