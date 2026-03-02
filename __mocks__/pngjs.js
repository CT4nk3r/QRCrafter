const PNG = {
  sync: {
    read: jest.fn(() => ({
      width: 100,
      height: 100,
      data: new Uint8Array(100 * 100 * 4), // RGBA data
    })),
  },
};

module.exports = {PNG};
