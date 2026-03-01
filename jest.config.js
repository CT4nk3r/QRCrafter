module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-.*)/)',
  ],
  moduleNameMapper: {
    'react-native-capture': '<rootDir>/__mocks__/react-native-capture.js',
    'react-native-share': '<rootDir>/__mocks__/react-native-share.js',
    '@react-native-camera-roll/camera-roll': '<rootDir>/__mocks__/camera-roll.js',
  },
};