module.exports = {
  __esModule: true,
  default: {
    getString: jest.fn(() => Promise.resolve('')),
    setString: jest.fn(),
    hasString: jest.fn(() => Promise.resolve(false)),
  },
};
