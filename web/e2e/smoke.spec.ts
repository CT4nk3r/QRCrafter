import { test, expect } from './fixtures/test';

test.describe('smoke', () => {
  test('page loads cleanly @smoke', async ({ page, create }) => {
    const problems: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') problems.push(`console: ${msg.text()}`);
    });
    page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));

    await create.goto();
    await expect(page).toHaveTitle('QRCrafter - Generate QR Codes');
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.json');
    expect(problems).toEqual([]);
  });

  test('default state @smoke', async ({ page, create }) => {
    await create.goto();
    await expect(page.getByRole('tab', { name: 'create' })).toHaveAttribute('aria-selected', 'true');
    await expect(create.typeButton('URL')).toHaveAttribute('aria-pressed', 'true');
    await expect(create.emptyState).toBeVisible();
    await expect(create.eclInput).toHaveValue('15');
    await expect(page.getByText('Customize Style')).toHaveCount(0);
  });

  test('typing a URL renders a scannable QR and a download button @smoke', async ({ create }) => {
    await create.goto();
    await create.fillSimple('https://example.com');
    expect(await create.decodeRenderedQr()).toBe('https://example.com');
    await expect(create.downloadButton).toBeVisible();
  });

  test('mode switch shows the decoder and back @smoke', async ({ page, create, decode }) => {
    await create.goto();
    await page.getByRole('tab', { name: 'decode' }).click();
    await expect(page.getByRole('heading', { name: 'Decode QR Code', exact: true })).toBeVisible();
    await expect(decode.fileInput).toBeVisible();
    await expect(decode.pasteButton).toBeVisible();
    await expect(decode.loadButton).toBeVisible();

    await page.getByRole('tab', { name: 'create' }).click();
    await expect(create.typeButton('URL')).toBeVisible();
  });
});
