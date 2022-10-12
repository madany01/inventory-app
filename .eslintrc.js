module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'airbnb-base', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    'no-underscore-dangle': ['off'],
    'no-return-assign': ['error', 'except-parens'],
    'no-use-before-define': ['error', { functions: false }],
    'consistent-return': 'off',
    'no-shadow': 'off',
  },
}
