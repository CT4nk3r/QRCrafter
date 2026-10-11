import { test, expect } from './fixtures/test';
import { blankPng, renderQrPng } from './utils/images';

test.describe('decode: file upload', () => {
  test.beforeEach(async ({ decode }) => {
    await decode.goto();
  });

  test('decodes a QR PNG', async ({ browser, baseURL, decode }) => {
    const png = await renderQrPng(browser, baseURL!, 'decode-me-123');
    await decode.uploadBuffer('qr.png', 'image/png', png);
    await expect(decode.success).toBeVisible();
    await expect(decode.result).toHaveText('decode-me-123');
  });

  test('decodes a JPEG too', async ({ page, browser, baseURL, decode }) => {
    const png = await renderQrPng(browser, baseURL!, 'jpeg-payload');
    const jpegBase64 = await page.evaluate(async (b64: string) => {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('png load failed'));
        img.src = `data:image/png;base64,${b64}`;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      return canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
    }, png.toString('base64'));
    await decode.uploadBuffer('qr.jpg', 'image/jpeg', Buffer.from(jpegBase64, 'base64'));
    await expect(decode.result).toHaveText('jpeg-payload');
  });

  test('a blank image has no QR code', async ({ decode }) => {
    await decode.uploadBuffer('blank.png', 'image/png', blankPng());
    await expect(decode.error).toHaveText('❌ No QR code found in the image');
    await expect(decode.success).toHaveCount(0);
  });

  test('a non-image file is rejected', async ({ decode }) => {
    await decode.uploadBuffer('notes.txt', 'text/plain', Buffer.from('hello'));
    await expect(decode.error).toHaveText('❌ Please select an image file');
  });

  test('a corrupt image fails to load', async ({ decode }) => {
    await decode.uploadBuffer('bad.png', 'image/png', Buffer.from('definitely not a png'));
    await expect(decode.error).toHaveText('❌ Failed to load image');
  });

  test('a second upload replaces the first result', async ({ browser, baseURL, decode }) => {
    await decode.uploadBuffer('a.png', 'image/png', await renderQrPng(browser, baseURL!, 'first'));
    await expect(decode.result).toHaveText('first');
    await decode.uploadBuffer('b.png', 'image/png', await renderQrPng(browser, baseURL!, 'second'));
    await expect(decode.result).toHaveText('second');
    await expect(decode.result).toHaveCount(1);
  });

  test('a successful decode clears an earlier error', async ({ browser, baseURL, decode }) => {
    await decode.uploadBuffer('blank.png', 'image/png', blankPng());
    await expect(decode.error).toBeVisible();
    await decode.uploadBuffer('ok.png', 'image/png', await renderQrPng(browser, baseURL!, 'recovered'));
    await expect(decode.result).toHaveText('recovered');
    await expect(decode.error).toHaveCount(0);
  });

  test('Copy puts the decoded text on the clipboard', async ({ page, context, browser, baseURL, decode }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await decode.uploadBuffer('qr.png', 'image/png', await renderQrPng(browser, baseURL!, 'copy-me'));
    await expect(decode.result).toHaveText('copy-me');
    await decode.copyButton.click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('copy-me');
  });
});
