import { test, expect } from './fixtures/test';

// The control snaps to fixed levels: <=7 → L(7), <=15 → M(15), <=25 → Q(25), else H(30).
const SNAP_CASES: Array<[string, string]> = [
  ['7', '7'],
  ['8', '15'],
  ['15', '15'],
  ['16', '25'],
  ['25', '25'],
  ['26', '30'],
  ['30', '30'],
  ['0', '7'],
  ['100', '30'],
  ['', '7'],
];

/** Number of QR modules per side, read from the SVG viewBox ("0 0 N N"). */
async function moduleCount(svg: import('@playwright/test').Locator): Promise<number> {
  const viewBox = await svg.getAttribute('viewBox');
  return Number(viewBox?.split(' ')[2]);
}

test.describe('error correction', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
  });

  test('defaults to 15 on both controls', async ({ create }) => {
    await expect(create.eclSlider).toHaveValue('15');
    await expect(create.eclInput).toHaveValue('15');
  });

  for (const [typed, snapped] of SNAP_CASES) {
    test(`typing "${typed}" snaps to ${snapped}`, async ({ create }) => {
      await create.setEclPercent(typed);
      await expect(create.eclInput).toHaveValue(snapped);
      await expect(create.eclSlider).toHaveValue(snapped);
    });
  }

  test('typing letters into the number box counts as empty (7)', async ({ create }) => {
    await create.eclInput.fill('');
    await create.eclInput.pressSequentially('abc');
    await create.eclInput.press('Enter');
    await expect(create.eclInput).toHaveValue('7');
  });

  test('the slider snaps too', async ({ create }) => {
    await create.setEclSlider(20);
    await expect(create.eclInput).toHaveValue('25');
    await expect(create.eclSlider).toHaveValue('25');
  });

  test('blur commits like Enter', async ({ create }) => {
    await create.eclInput.fill('26');
    await create.eclInput.press('Tab');
    await expect(create.eclInput).toHaveValue('30');
  });

  test('higher levels are denser and every level stays scannable', async ({ create }) => {
    const text = 'https://example.com/error-correction';
    await create.fillSimple(text);

    await create.setEclPercent(7);
    const low = await moduleCount(create.qrSvg);
    expect(await create.decodeRenderedQr()).toBe(text);

    for (const percent of [15, 25, 30]) {
      await create.setEclPercent(percent);
      expect(await create.decodeRenderedQr()).toBe(text);
    }
    const high = await moduleCount(create.qrSvg);
    expect(high).toBeGreaterThanOrEqual(low);
  });

  test('survives a type switch', async ({ create }) => {
    await create.setEclPercent(30);
    await create.selectType('Text');
    await expect(create.eclInput).toHaveValue('30');
  });
});
