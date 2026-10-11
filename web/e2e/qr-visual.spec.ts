import { test, expect } from './fixtures/test';

// Pixel baselines for the rendered QR code itself (not the page around it).
// The plan keeps page-level visual regression out of scope; these cover only the QR element,
// which is vector black/white and renders identically everywhere.
// Regenerate on purpose with: npm run test:e2e -- qr-visual --update-snapshots
test.describe('QR code visual baselines', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
  });

  test('url, default style', async ({ create }) => {
    await create.fillSimple('https://example.com');
    await expect(create.qrCode).toHaveScreenshot('url-default.png');
  });

  test('wifi', async ({ create }) => {
    await create.selectType('Wi-Fi');
    await create.fillWifi({ ssid: 'QRCrafter', password: 'correct horse' });
    await expect(create.qrCode).toHaveScreenshot('wifi.png');
  });

  test('high error correction', async ({ create }) => {
    await create.fillSimple('https://example.com/some/longer/path');
    await create.setEclPercent(30);
    await expect(create.qrCode).toHaveScreenshot('url-ecl-30.png');
  });

  test('custom colours', async ({ create }) => {
    await create.fillSimple('https://example.com');
    await create.setFgHex('#1E3A8A');
    await create.setBgHex('#FEF9C3');
    await expect(create.qrCode).toHaveScreenshot('url-blue-on-cream.png');
  });
});
