import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/test';

// Responsive layout guard (an addition to the plan): nothing may overflow the viewport.
const WIDTHS = [320, 375, 768, 1024, 1440];
const TYPES = ['URL', 'Text', 'Wi-Fi', 'Email', 'Phone', 'SMS'] as const;

/** Elements poking outside the viewport horizontally (the country list scrolls on its own). */
async function offscreenElements(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll('body *')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        return (
          r.width > 0 &&
          (r.right > innerWidth + 1 || r.left < -1) &&
          !el.closest('[role=listbox]')
        );
      })
      .slice(0, 5)
      .map(el => `${el.tagName}.${String(el.className).slice(0, 50)}`),
  );
}

async function expectFits(page: Page): Promise<void> {
  const scrolls = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(scrolls, 'page scrolls horizontally').toBe(false);
  expect(await offscreenElements(page), 'elements outside the viewport').toEqual([]);
}

for (const width of WIDTHS) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test.describe(`${width}px ${colorScheme}`, () => {
      test.use({ viewport: { width, height: 900 }, colorScheme });

      test('create mode: every QR type fits', async ({ create }) => {
        await create.goto();
        for (const type of TYPES) {
          await create.selectType(type);
          await expectFits(create.page);
        }
        await create.openStyle();
        await expectFits(create.page);
      });

      test('country picker fits inside the viewport', async ({ create }) => {
        await create.goto();
        await create.selectType('Phone');
        await create.countryButton().click();
        const box = await create.page.getByRole('listbox').boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      });

      test('decode mode fits', async ({ decode }) => {
        await decode.goto();
        await expectFits(decode.page);
      });
    });
  }
}

test.describe('responsive structure', () => {
  test('phone stacks the preview under the form; desktop puts it beside', async ({ page, create }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await create.goto();
    await create.fillSimple('https://example.com');
    const form = (await page.locator('#qr-input').boundingBox())!;
    const qr = (await create.qrCode.boundingBox())!;
    expect(qr.y).toBeGreaterThan(form.y);
    expect(Math.abs(qr.x - form.x)).toBeLessThan(60);

    await page.setViewportSize({ width: 1280, height: 800 });
    const formWide = (await page.locator('#qr-input').boundingBox())!;
    const qrWide = (await create.qrCode.boundingBox())!;
    expect(qrWide.x).toBeGreaterThan(formWide.x + formWide.width);
  });

  test('a large QR scales down on a small screen', async ({ page, create }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await create.goto();
    await create.fillSimple('https://example.com');
    await create.openStyle();
    await create.sizeSlider().fill('400');
    const box = (await create.qrCode.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    // ...but is still scannable and still downloads at full resolution
    expect(await create.decodeRenderedQr()).toBe('https://example.com');
  });
});
