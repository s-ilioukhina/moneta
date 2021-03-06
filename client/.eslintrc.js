module.exports = {
  'extends': ['airbnb', 'prettier'],
  'parser': 'babel-eslint',
  'env': {
    'jest': true,
  },
  'rules': {
    'no-use-before-define': 'off',
    'react/no-unused-state': 'off',
    'react/no-unused-prop-types': 'off',
    'react/jsx-filename-extension': 'off',
    'react/prop-types': 'off',
    'comma-dangle': 'off',
    'prettier/prettier': 'error',
    'no-underscore-dangle': 'off',
    'react/no-string-refs': 'off',
    "react/jsx-props-no-spreading": 'off'
  },
  'globals': {
    "fetch": false
  },
  'plugins': ['prettier'],
}
