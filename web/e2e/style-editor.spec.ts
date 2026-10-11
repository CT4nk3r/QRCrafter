import { test, expect } from './fixtures/test';

test.describe('style editor', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
    await create.fillSimple('https://example.com');
  });

  test('toggles open and closed', async ({ page, create }) => {
    await expect(create.styleToggle()).toContainText('▼');
    await create.styleToggle().click();
    await expect(page.getByText('Customize Style')).toBeVisible();
    await expect(create.styleToggle()).toContainText('▲');
    await create.styleToggle().click();
    await expect(page.getByText('Customize Style')).toHaveCount(0);
  });

  test('foreground preset updates the QR modules', async ({ create }) => {
    await create.openStyle();
    await create.preset('fg', '#2563EB').click();
    await expect(create.preset('fg', '#2563EB')).toHaveAttribute('aria-pressed', 'true');
    await expect(create.preset('fg', '#000000')).toHaveAttribute('aria-pressed', 'false');
    // react-qr-code draws a background <path> then a foreground <path>
    await expect(create.qrSvg.locator('path').last()).toHaveAttribute('fill', '#2563EB');
  });

  test('background preset updates the QR background', async ({ create }) => {
    await create.openStyle();
    await create.preset('bg', '#FFFFFF').click(); // already selected: still pressed
    await create.preset('bg', '#16A34A').click();
    await expect(create.qrCode).toHaveCSS('background-color', 'rgb(22, 163, 74)');
    await expect(create.qrSvg.locator('path').first()).toHaveAttribute('fill', '#16A34A');
  });

  test('hex without "#" is accepted, upper-cased and applied', async ({ create }) => {
    await create.setFgHex('ff0000');
    await expect(create.hexInput('fg')).toHaveValue('#FF0000');
    await expect(create.qrSvg.locator('path').last()).toHaveAttribute('fill', '#FF0000');
  });

  test('an invalid hex reverts to the last colour on blur', async ({ create }) => {
    await create.setFgHex('#2563EB');
    await create.hexInput('fg').fill('#12');
    await create.hexInput('fg').press('Tab');
    await expect(create.hexInput('fg')).toHaveValue('#2563EB');
    await expect(create.qrSvg.locator('path').last()).toHaveAttribute('fill', '#2563EB');
  });

  test('3-digit hex is accepted', async ({ create }) => {
    await create.setFgHex('#0f0');
    await expect(create.hexInput('fg')).toHaveValue('#0F0');
  });

  test('size slider resizes the SVG', async ({ create }) => {
    await create.openStyle();
    await create.sizeSlider().fill('300');
    await expect(create.qrSvg).toHaveAttribute('width', '300');
    await expect(create.qrSvg).toHaveAttribute('height', '300');
    await expect(create.sizeText()).toHaveValue('300');
  });

  test('size text box commits on Enter', async ({ create }) => {
    await create.openStyle();
    await create.sizeText().fill('150');
    await create.sizeText().press('Enter');
    await expect(create.qrSvg).toHaveAttribute('width', '150');
  });

  for (const bad of ['119', '401', 'abc']) {
    test(`out-of-range size "${bad}" reverts on blur`, async ({ create }) => {
      await create.openStyle();
      await create.sizeText().fill('200');
      await create.sizeText().press('Enter');
      await create.sizeText().fill(bad);
      await create.sizeText().press('Tab');
      await expect(create.sizeText()).toHaveValue('200');
      await expect(create.qrSvg).toHaveAttribute('width', '200');
    });
  }

  test('dark-on-light custom colours stay scannable', async ({ create }) => {
    await create.setFgHex('#2563EB');
    await create.setBgHex('#FFFFFF');
    expect(await create.decodeRenderedQr()).toBe('https://example.com');
  });

  test('style survives a type switch', async ({ create }) => {
    await create.setFgHex('#DC2626');
    await create.selectType('Text');
    await create.fillSimple('hello');
    await expect(create.qrSvg.locator('path').last()).toHaveAttribute('fill', '#DC2626');
  });
});
