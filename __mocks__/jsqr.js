module.exports = jest.fn(() => ({
  data: 'mock-qr-data',
  location: {
    topLeftCorner: { x: 0, y: 0 },
    topRightCorner: { x: 100, y: 0 },
    bottomLeftCorner: { x: 0, y: 100 },
    bottomRightCorner: { x: 100, y: 100 },
  },
}));
