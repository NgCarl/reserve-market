import globals from 'globals'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'

export default [
  {
    ignores: ['dist/**', 'build/**', 'src/generated/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      sourceType: 'module',
      globals: { ...globals.node },
      ecmaVersion: 'latest',
    },
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@stylistic/indent': ['error', 2],
      '@stylistic/linebreak-style': ['error', 'unix'],
      // avoidEscape : « "Salade d'avocat" » plutôt que « 'Salade d\'avocat' »
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/semi': ['error', 'never'],
      eqeqeq: 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
      'no-console': 'off',
    },
  },
]
