import { test, expect } from './fixtures/test';

test.describe('URL and Text', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
  });

  test('URL is encoded verbatim', async ({ create }) => {
    const url = 'https://example.com/a?b=1&c=two#frag';
    await create.fillSimple(url);
    expect(await create.decodeRenderedQr()).toBe(url);
  });

  test('Text keeps newlines', async ({ create }) => {
    await create.selectType('Text');
    await create.fillSimple('Hello\nWorld');
    expect(await create.decodeRenderedQr()).toBe('Hello\nWorld');
  });

  // BUG (reported): non-ASCII is written as one Latin-1 byte per character instead of UTF-8,
  // so scanners read garbage. Expected to fail until the encoding is fixed.
  test('Text keeps Unicode (UTF-8)', async ({ create }) => {
    test.fail(true, 'App encodes non-ASCII QR content as Latin-1/truncated code units, not UTF-8');
    await create.selectType('Text');
    const text = 'Wörld 🌍 日本';
    await create.fillSimple(text);
    expect((await create.decodeRenderedQr()).normalize('NFC')).toBe(text.normalize('NFC'));
  });

  test('clearing the input restores the empty state', async ({ create }) => {
    await create.fillSimple('https://example.com');
    await expect(create.qrSvg).toBeVisible();
    await create.fillSimple('');
    await expect(create.qrSvg).toHaveCount(0);
    await expect(create.emptyState).toBeVisible();
    await expect(create.downloadButton).toHaveCount(0);
  });

  test('switching type clears the value', async ({ page, create }) => {
    await create.fillSimple('https://example.com');
    await create.selectType('Text');
    await expect(page.locator('#qr-input')).toHaveValue('');
    await expect(create.emptyState).toBeVisible();
  });

  test('state survives a Create → Decode → Create round trip', async ({ page, create }) => {
    await create.fillSimple('https://example.com/keep');
    await page.getByRole('tab', { name: 'decode' }).click();
    await page.getByRole('tab', { name: 'create' }).click();
    await expect(page.locator('#qr-input')).toHaveValue('https://example.com/keep');
    expect(await create.decodeRenderedQr()).toBe('https://example.com/keep');
  });
});
