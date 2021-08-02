module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-await-in-loop': 0,
    'no-constant-condition': 0,
    'no-console': 0,
    camelcase: 0,
    'no-restricted-syntax': 0,
    'no-else-return': 0,
  },
};
