import pako from 'pako';

import { decodePNG } from '../src/utils/pngDecoder';

function uint32(value: number): number[] {
  return [
    Math.floor(value / 0x1000000) % 0x100,
    Math.floor(value / 0x10000) % 0x100,
    Math.floor(value / 0x100) % 0x100,
    value % 0x100,
  ];
}

function chunk(type: string, data: number[] | Uint8Array): number[] {
  return [
    ...uint32(data.length),
    ...Array.from(type).map(char => char.charCodeAt(0)),
    ...data,
    0,
    0,
    0,
    0,
  ];
}

function createPng(bitDepth: number): Uint8Array {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ihdr = [
    ...uint32(1),
    ...uint32(1),
    bitDepth,
    6,
    0,
    0,
    0,
  ];
  const imageData = pako.deflate(new Uint8Array([0, 255, 0, 0, 255]));

  return new Uint8Array([
    ...signature,
    ...chunk('IHDR', ihdr),
    ...chunk('IDAT', imageData),
    ...chunk('IEND', []),
  ]);
}

describe('decodePNG', () => {
  it('decodes an 8-bit RGBA PNG', () => {
    const png = decodePNG(createPng(8));

    expect(png.width).toBe(1);
    expect(png.height).toBe(1);
    expect(Array.from(png.data)).toEqual([255, 0, 0, 255]);
  });

  it('rejects unsupported bit depths', () => {
    expect(() => decodePNG(createPng(16))).toThrow(
      'Unsupported PNG bit depth: 16',
    );
  });
});
