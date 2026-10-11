import type { Browser } from '@playwright/test';
import { PNG } from 'pngjs';

type Rgba = [number, number, number, number];

/** A solid-colour PNG with no QR code in it. */
export function blankPng(
  width = 200,
  height = 200,
  rgba: Rgba = [255, 255, 255, 255],
): Buffer {
  const png = new PNG({ width, height });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = rgba[0];
    png.data[i + 1] = rgba[1];
    png.data[i + 2] = rgba[2];
    png.data[i + 3] = rgba[3];
  }
  return PNG.sync.write(png);
}

/** Read a pixel from a PNG buffer. */
export function pixelAt(buffer: Buffer, x: number, y: number): Rgba {
  const png = PNG.sync.read(buffer);
  const i = (png.width * y + x) * 4;
  return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
}

/** Fraction (0-1) of pixels that exactly match a colour. */
export function colourShare(buffer: Buffer, rgba: Rgba): number {
  const png = PNG.sync.read(buffer);
  let hits = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (
      png.data[i] === rgba[0] &&
      png.data[i + 1] === rgba[1] &&
      png.data[i + 2] === rgba[2] &&
      png.data[i + 3] === rgba[3]
    ) {
      hits++;
    }
  }
  return hits / (png.width * png.height);
}

/** Width/height from the PNG header (bytes 16-24). */
export function pngSize(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

const cache = new Map<string, Promise<Buffer>>();

/**
 * Screenshot the app's own rendered QR for `value`. QR codes are never hand-encoded
 * in tests: the app is the encoder, the fixture is whatever it draws.
 * Cached per worker.
 */
export function renderQrPng(browser: Browser, baseURL: string, value: string): Promise<Buffer> {
  let pending = cache.get(value);
  if (!pending) {
    pending = (async () => {
      const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 } });
      try {
        const page = await context.newPage();
        await page.goto('/');
        await page.locator('#qr-input').fill(value);
        return await page
          .getByTestId('qr-code')
          .screenshot({ animations: 'disabled', scale: 'device' });
      } finally {
        await context.close();
      }
    })();
    cache.set(value, pending);
  }
  return pending;
}
