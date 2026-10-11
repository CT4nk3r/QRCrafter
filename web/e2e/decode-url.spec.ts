import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';
import { blankPng, renderQrPng } from './utils/images';
import { startImageServer } from './utils/server';

const FAKE_URL = 'https://fixtures.qrcrafter.test/qr.png';
const LOAD_FAILED =
  '❌ Failed to load image from URL. Make sure the URL is correct and CORS is enabled.';

async function serveImage(page: Page, body: Buffer): Promise<void> {
  await page.route(FAKE_URL, route =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body,
    }),
  );
}

test.describe('decode: load from URL', () => {
  test.beforeEach(async ({ decode }) => {
    await decode.goto();
  });

  test('decodes a QR served with CORS', async ({ page, browser, baseURL, decode }) => {
    await serveImage(page, await renderQrPng(browser, baseURL!, 'from-url'));
    await decode.loadUrl(FAKE_URL);
    await expect(decode.result).toHaveText('from-url');
  });

  test('requests exactly the URL that was entered', async ({ page, browser, baseURL, decode }) => {
    await serveImage(page, await renderQrPng(browser, baseURL!, 'exact'));
    const request = page.waitForRequest(FAKE_URL);
    await decode.loadUrl(FAKE_URL);
    expect((await request).url()).toBe(FAKE_URL);
  });

  test('an empty URL asks for one', async ({ decode }) => {
    await decode.loadButton.click();
    await expect(decode.error).toHaveText('❌ Please enter an image URL');
  });

  test('a whitespace-only URL counts as empty', async ({ decode }) => {
    await decode.loadUrl('   ');
    await expect(decode.error).toHaveText('❌ Please enter an image URL');
  });

  test('a network failure reports the CORS hint', async ({ page, decode }) => {
    await page.route(FAKE_URL, route => route.abort());
    await decode.loadUrl(FAKE_URL);
    await expect(decode.error).toHaveText(LOAD_FAILED);
  });

  // A real cross-origin server (see utils/server.ts): page.route() would add CORS headers itself.
  test('a cross-origin image without CORS headers is rejected', async ({ browser, baseURL, decode }) => {
    const server = await startImageServer(await renderQrPng(browser, baseURL!, 'no-cors'), false);
    try {
      await decode.loadUrl(server.url);
      await expect(decode.error).toHaveText(LOAD_FAILED);
    } finally {
      await server.close();
    }
  });

  test('the same cross-origin image with CORS headers decodes', async ({ browser, baseURL, decode }) => {
    const server = await startImageServer(await renderQrPng(browser, baseURL!, 'with-cors'), true);
    try {
      await decode.loadUrl(server.url);
      await expect(decode.result).toHaveText('with-cors');
    } finally {
      await server.close();
    }
  });

  test('an image without a QR code reports it', async ({ page, decode }) => {
    await serveImage(page, blankPng());
    await decode.loadUrl(FAKE_URL);
    await expect(decode.error).toHaveText('❌ No QR code found in the image');
  });
});
