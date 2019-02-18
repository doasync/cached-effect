module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    allowImportExportEverywhere: true,
    codeFrame: false,
  },
  extends: [
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'airbnb',
  ],
  plugins: [
    'promise',
    'html',
    'react-hooks',
  ],
  settings: {
    'import/resolver': {
      webpack: {
        config: './webpack.config.js',
      },
    },
  },
  rules: {
    'import/prefer-default-export': 'off', // prefer named export
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'always', // use space
      asyncArrow: 'always',
    }],
    'react/jsx-filename-extension': ['error', {
      extensions: ['.js'], // no .jsx
    }],
    'eslint-comments/disable-enable-pair': ['error', {
      allowWholeFile: true,
    }],
    'no-restricted-syntax': [
      'error',
      'ForInStatement',
      'LabeledStatement',
      'WithStatement',
      "BinaryExpression[operator='in']",
    ],
    'react-hooks/rules-of-hooks': 'error',
    'spaced-comment': ['error', 'always', { markers: [':', '::'] }],
    'react/require-default-props': 'off', // optional props without defaults
    'react/sort-comp': 'off', // do not sort React class fields/methods
    'object-curly-newline': ['warn', {
      ObjectExpression: { minProperties: 5, multiline: true, consistent: true },
      ObjectPattern: { minProperties: 5, multiline: true, consistent: true },
      ImportDeclaration: { minProperties: 5, multiline: true, consistent: true },
      ExportDeclaration: { minProperties: 5, multiline: true, consistent: true },
    }],
    'quote-props': ['warn', 'as-needed', { 'numbers': true }],
    'max-len': ['warn', {
      code: 100,
      tabWidth: 2,
      ignoreComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true
    }],
    'no-nested-ternary': 'warn',
    'arrow-body-style': 'warn'
  },
};
