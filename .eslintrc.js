// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    'no-trailing-spaces': 'error',
    'quotes': 'off',
    'indent': ['error', 2],
    'curly': ['error', 'all'],
    'no-alert': 'error',
    'no-caller': 'error',
    'no-implicit-globals': 'error',
    'no-floating-decimal': 'error',
    'no-multi-spaces': 'error',
    'no-param-reassign': 'error',
    'no-warning-comments': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': ['error', {'ignoreParameters': true}],
    '@typescript-eslint/quotes': ['error', 'single']
  }
}