/* eslint-env jest */
/**
 * Jest setup.
 *
 * Mocks the native modules that are imported by the mobile screens but have no
 * JavaScript implementation under the jest/node environment. Without these the
 * app smoke test crashes at import time (e.g. TurboModule `getEnforcing`).
 *
 * Factories use `require` internally because `jest.mock` calls are hoisted and
 * may not reference out-of-scope variables.
 */

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: {
    getString: jest.fn(() => Promise.resolve('')),
    setString: jest.fn(),
    getImage: jest.fn(() => Promise.resolve('')),
    hasImage: jest.fn(() => Promise.resolve(false)),
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(() => Promise.resolve({didCancel: true})),
  launchCamera: jest.fn(() => Promise.resolve({didCancel: true})),
}));

jest.mock('react-native-wifi-reborn', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: props => React.createElement('Slider', props, props.children),
  };
});

jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: props => React.createElement('QRCode', props, props.children),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = {top: 0, right: 0, bottom: 0, left: 0};
  const frame = {x: 0, y: 0, width: 390, height: 844};
  const passthrough = ({children}) =>
    React.createElement(React.Fragment, null, children);
  return {
    __esModule: true,
    SafeAreaProvider: passthrough,
    SafeAreaView: passthrough,
    SafeAreaInsetsContext: React.createContext(insets),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
  };
});
