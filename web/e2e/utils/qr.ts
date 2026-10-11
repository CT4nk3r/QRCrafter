import type { Locator } from '@playwright/test';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';

interface DecodeOptions {
  /** White border (px) added before decoding, for images without a quiet zone. */
  padding?: number;
}

function addPadding(png: PNG, padding: number): PNG {
  const out = new PNG({
    width: png.width + padding * 2,
    height: png.height + padding * 2,
  });
  out.data.fill(255);
  PNG.bitblt(png, out, 0, 0, png.width, png.height, padding, padding);
  return out;
}

/** Decode a QR code from a PNG buffer. Throws if none is found. */
export function decodeQrPng(buffer: Buffer, opts: DecodeOptions = {}): string {
  let png: PNG = PNG.sync.read(buffer);
  if (opts.padding) {
    png = addPadding(png, opts.padding);
  }
  const result = jsQR(
    new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length),
    png.width,
    png.height,
  );
  if (!result) {
    throw new Error(`No QR code found in ${png.width}x${png.height} image`);
  }
  return result.data;
}

/** Screenshot a locator and decode the QR code inside it. */
export async function decodeQrLocator(locator: Locator): Promise<string> {
  const png = await locator.screenshot({ animations: 'disabled', scale: 'device' });
  return decodeQrPng(png);
}
