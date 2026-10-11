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

  // Regression: non-ASCII used to be written as one Latin-1 byte per character, not UTF-8
  test('Text keeps Unicode (UTF-8)', async ({ create }) => {
    await create.selectType('Text');
    const text = 'Wörld 🌍 日本';
    await create.fillSimple(text);
    expect((await create.decodeRenderedQr()).normalize('NFC')).toBe(text.normalize('NFC'));
  });

  test('a URL with non-ASCII characters is encoded as UTF-8', async ({ create }) => {
    const url = 'https://example.com/café/日本?q=ñ';
    await create.fillSimple(url);
    expect(await create.decodeRenderedQr()).toBe(url);
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
