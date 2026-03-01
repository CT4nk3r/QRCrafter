module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-.*)/)',
  ],
  moduleNameMapper: {
    'react-native-view-shot': '<rootDir>/__mocks__/react-native-view-shot.js',
    'react-native-share': '<rootDir>/__mocks__/react-native-share.js',
    '@react-native-camera-roll/camera-roll': '<rootDir>/__mocks__/camera-roll.js',
  },
};