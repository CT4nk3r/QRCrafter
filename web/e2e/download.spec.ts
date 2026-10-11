import { readFile } from 'node:fs/promises';
import type { Download } from '@playwright/test';
import { test, expect } from './fixtures/test';
import { decodeQrPng } from './utils/qr';
import { colourShare, pngSize } from './utils/images';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function bytesOf(download: Download): Promise<Buffer> {
  const path = await download.path();
  return readFile(path);
}

test.describe('download', () => {
  test.beforeEach(async ({ create }) => {
    await create.goto();
    await create.fillSimple('https://example.com/download');
  });

  test('is named qrcode.png', async ({ create }) => {
    const [download] = await Promise.all([
      create.page.waitForEvent('download'),
      create.downloadButton.click(),
    ]);
    expect(download.suggestedFilename()).toBe('qrcode.png');
  });

  test('is a PNG at 4x the QR size', async ({ create }) => {
    const [download] = await Promise.all([
      create.page.waitForEvent('download'),
      create.downloadButton.click(),
    ]);
    const png = await bytesOf(download);
    expect(png.subarray(0, 8)).toEqual(PNG_MAGIC);
    expect(pngSize(png)).toEqual({ width: 1024, height: 1024 });
  });

  test('size follows the style size', async ({ create }) => {
    await create.openStyle();
    await create.sizeSlider().fill('300');
    const [download] = await Promise.all([
      create.page.waitForEvent('download'),
      create.downloadButton.click(),
    ]);
    expect(pngSize(await bytesOf(download))).toEqual({ width: 1200, height: 1200 });
  });

  test('decodes back to the input (with a quiet zone added)', async ({ create }) => {
    const [download] = await Promise.all([
      create.page.waitForEvent('download'),
      create.downloadButton.click(),
    ]);
    expect(decodeQrPng(await bytesOf(download), { padding: 32 })).toBe(
      'https://example.com/download',
    );
  });

  // FINDING: the exported PNG has no quiet zone (blank margin). Many scanners need one.
  // This test only reports the current behaviour; see roundtrip.spec.ts for the app's own decoder.
  test('reports whether the raw PNG decodes without any margin', async ({ create }, testInfo) => {
    const [download] = await Promise.all([
      create.page.waitForEvent('download'),
      create.downloadButton.click(),
    ]);
    let decoded: string | null = null;
    try {
      decoded = decodeQrPng(await bytesOf(download));
    } catch {
      decoded = null;
    }
    testInfo.annotations.push({
      type: 'quiet-zone',
      description: decoded
        ? 'raw download decodes without a margin'
        : 'raw download does NOT decode without a margin',
    });
    expect(decoded === null || decoded === 'https://example.com/download').toBe(true);
  });

  test('uses the custom background colour', async ({ create }) => {
    await create.setBgHex('#FFFF00');
    const [download] = await Promise.all([
      create.page.waitForEvent('download'),
      create.downloadButton.click(),
    ]);
    // The corner is a dark finder-pattern module (no quiet zone), so check the overall share
    expect(colourShare(await bytesOf(download), [255, 255, 0, 255])).toBeGreaterThan(0.4);
  });
});
