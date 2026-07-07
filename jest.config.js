module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-.*|@react-native-.*)/)',
  ],
  moduleNameMapper: {
    'react-native-capture': '<rootDir>/__mocks__/react-native-capture.js',
    'react-native-share': '<rootDir>/__mocks__/react-native-share.js',
    '@react-native-camera-roll/camera-roll':
      '<rootDir>/__mocks__/camera-roll.js',
    '@react-native-clipboard/clipboard': '<rootDir>/__mocks__/clipboard.js',
    'react-native-image-picker':
      '<rootDir>/__mocks__/react-native-image-picker.js',
  },
};
