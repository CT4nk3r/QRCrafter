import { readFile } from 'node:fs/promises';
import { test, expect } from './fixtures/test';
import { decodeQrLocator } from './utils/qr';

test('oracle sanity: a rendered QR decodes to its input', async ({ create }) => {
  await create.goto();
  await create.fillSimple('oracle-sanity-check');
  expect(await decodeQrLocator(create.qrCode)).toBe('oracle-sanity-check');
});

const CASES = [
  { type: 'URL', fill: 'url', expected: 'https://example.com/roundtrip?x=1' },
  { type: 'Text', fill: 'text', expected: 'Round trip text' },
  { type: 'Wi-Fi', fill: 'wifi', expected: 'WIFI:T:WPA;S:Home;P:secret;H:false;;' },
  { type: 'Email', fill: 'email', expected: 'mailto:a@b.co?subject=Hi' },
  { type: 'Phone', fill: 'phone', expected: 'tel:+15551234567' },
  { type: 'SMS', fill: 'sms', expected: 'smsto:+15551234567:Hello' },
] as const;

test.describe('create → decode round trip (the app reads its own output)', () => {
  for (const { type, fill, expected } of CASES) {
    test(type, async ({ create, decode }) => {
      await create.goto();
      await create.selectType(type);
      switch (fill) {
        case 'url':
          await create.fillSimple('https://example.com/roundtrip?x=1');
          break;
        case 'text':
          await create.fillSimple('Round trip text');
          break;
        case 'wifi':
          await create.fillWifi({ ssid: 'Home', password: 'secret' });
          break;
        case 'email':
          await create.fillEmail({ address: 'a@b.co', subject: 'Hi' });
          break;
        case 'phone':
          await create.fillPhone('5551234567');
          break;
        case 'sms':
          await create.fillSms({ phone: '5551234567', message: 'Hello' });
          break;
      }
      const screenshot = await create.qrCode.screenshot({ animations: 'disabled', scale: 'device' });
      await create.page.getByRole('tab', { name: 'decode' }).click();
      await decode.uploadBuffer('qr.png', 'image/png', screenshot);
      await expect(decode.result).toHaveText(expected);
    });
  }

  // FINDING candidate: the download has no quiet zone. If this fails, report it (see download.spec.ts).
  test('the downloaded PNG, as-is, decodes in the app', async ({ create, decode }) => {
    await create.goto();
    await create.fillSimple('https://example.com/as-is');
    const [download] = await Promise.all([
      create.page.waitForEvent('download'),
      create.downloadButton.click(),
    ]);
    const png = await readFile(await download.path());
    await create.page.getByRole('tab', { name: 'decode' }).click();
    await decode.uploadBuffer('download.png', 'image/png', png);
    await expect(decode.result).toHaveText('https://example.com/as-is');
  });
});
