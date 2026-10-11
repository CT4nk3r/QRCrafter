import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';
import { renderQrPng } from './utils/images';

// Real clipboard images are fragile in headless Chromium, so navigator.clipboard.read is stubbed.
type Stub = { kind: 'image'; base64: string } | { kind: 'text' } | { kind: 'reject' };

async function stubClipboardRead(page: Page, stub: Stub): Promise<void> {
  await page.evaluate((s: Stub) => {
    const read = async (): Promise<ClipboardItem[]> => {
      if (s.kind === 'reject') throw new DOMException('denied', 'NotAllowedError');
      if (s.kind === 'text') {
        return [new ClipboardItem({ 'text/plain': new Blob(['just text'], { type: 'text/plain' }) })];
      }
      const bytes = Uint8Array.from(atob(s.base64), c => c.charCodeAt(0));
      return [new ClipboardItem({ 'image/png': new Blob([bytes], { type: 'image/png' }) })];
    };
    Object.defineProperty(navigator, 'clipboard', { value: { read }, configurable: true });
  }, stub);
}

test.describe('decode: clipboard', () => {
  test.beforeEach(async ({ decode }) => {
    await decode.goto();
  });

  test('pasting a QR image decodes it', async ({ page, browser, baseURL, decode }) => {
    const png = await renderQrPng(browser, baseURL!, 'from-clipboard');
    await stubClipboardRead(page, { kind: 'image', base64: png.toString('base64') });
    await decode.paste();
    await expect(decode.result).toHaveText('from-clipboard');
  });

  test('a clipboard without an image reports it', async ({ page, decode }) => {
    await stubClipboardRead(page, { kind: 'text' });
    await decode.paste();
    await expect(decode.error).toHaveText('❌ No image found in clipboard');
  });

  test('a denied clipboard reports the permission problem', async ({ page, decode }) => {
    await stubClipboardRead(page, { kind: 'reject' });
    await decode.paste();
    await expect(decode.error).toHaveText(
      '❌ Failed to access clipboard. Please make sure you have granted permission.',
    );
  });
});
