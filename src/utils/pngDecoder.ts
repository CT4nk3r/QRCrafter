/**
 * Minimal pure JavaScript PNG decoder for React Native
 * Extracts raw RGBA pixel data from PNG files without Node.js dependencies
 * Uses only standard JavaScript APIs and pako for zlib decompression
 */

import pako from 'pako';

// PNG signature
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Filter types
const FilterType = {
  NONE: 0,
  SUB: 1,
  UP: 2,
  AVERAGE: 3,
  PAETH: 4,
} as const;

interface PNGData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/**
 * Read big-endian 4-byte unsigned integer
 */
function readUInt32BE(buffer: Uint8Array, offset: number): number {
  return (
    (buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]
  );
}

/**
 * Read big-endian 2-byte unsigned integer
 */
function readUInt16BE(buffer: Uint8Array, offset: number): number {
  return (buffer[offset] << 8) | buffer[offset + 1];
}

/**
 * CRC-32 checksum (for validation)
 */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crc ^ data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Paeth predictor function for PNG filtering
 */
function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);

  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/**
 * Unfilter PNG scanline based on filter type
 */
function unfilterScanline(
  scanline: Uint8Array,
  previousScanline: Uint8Array | null,
  filterType: number,
  bytesPerPixel: number
): void {
  const len = scanline.length;

  switch (filterType) {
    case FilterType.NONE:
      // No filtering
      break;

    case FilterType.SUB:
      for (let i = bytesPerPixel; i < len; i++) {
        scanline[i] = (scanline[i] + scanline[i - bytesPerPixel]) & 0xff;
      }
      break;

    case FilterType.UP:
      if (previousScanline) {
        for (let i = 0; i < len; i++) {
          scanline[i] = (scanline[i] + previousScanline[i]) & 0xff;
        }
      }
      break;

    case FilterType.AVERAGE:
      for (let i = 0; i < len; i++) {
        const left = i >= bytesPerPixel ? scanline[i - bytesPerPixel] : 0;
        const up = previousScanline ? previousScanline[i] : 0;
        scanline[i] = (scanline[i] + Math.floor((left + up) / 2)) & 0xff;
      }
      break;

    case FilterType.PAETH:
      for (let i = 0; i < len; i++) {
        const left = i >= bytesPerPixel ? scanline[i - bytesPerPixel] : 0;
        const up = previousScanline ? previousScanline[i] : 0;
        const diag = previousScanline && i >= bytesPerPixel ? previousScanline[i - bytesPerPixel] : 0;
        scanline[i] = (scanline[i] + paeth(left, up, diag)) & 0xff;
      }
      break;
  }
}

/**
 * Parse PNG file and extract image data
 */
export function decodePNG(buffer: Uint8Array): PNGData {
  let offset = 0;

  // Validate PNG signature
  for (let i = 0; i < 8; i++) {
    if (buffer[offset + i] !== PNG_SIGNATURE[i]) {
      throw new Error('Invalid PNG signature');
    }
  }
  offset += 8;

  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks: Uint8Array[] = [];

  // Parse chunks
  while (offset < buffer.length) {
    const length = readUInt32BE(buffer, offset);
    offset += 4;

    const chunkType = String.fromCharCode(
      buffer[offset],
      buffer[offset + 1],
      buffer[offset + 2],
      buffer[offset + 3]
    );
    offset += 4;

    const chunkData = buffer.slice(offset, offset + length);
    offset += length;

    // Skip CRC (4 bytes)
    const crc = readUInt32BE(buffer, offset);
    offset += 4;

    if (chunkType === 'IHDR') {
      width = readUInt32BE(chunkData, 0);
      height = readUInt32BE(chunkData, 4);
      bitDepth = chunkData[8];
      colorType = chunkData[9];
      // Compression method, filter method, interlace method are at bytes 10, 11, 12
    } else if (chunkType === 'IDAT') {
      idatChunks.push(chunkData);
    } else if (chunkType === 'IEND') {
      break;
    }
  }

  if (!width || !height) {
    throw new Error('Invalid PNG: missing IHDR chunk');
  }

  if (idatChunks.length === 0) {
    throw new Error('Invalid PNG: missing IDAT chunk');
  }

  // Combine all IDAT chunks
  let totalLength = 0;
  for (const chunk of idatChunks) {
    totalLength += chunk.length;
  }

  const compressedData = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of idatChunks) {
    compressedData.set(chunk, pos);
    pos += chunk.length;
  }

  // Decompress using zlib
  const decompressed = pako.inflate(compressedData);

  // Determine bytes per pixel based on color type
  let bytesPerPixel = 0;
  let hasAlpha = false;

  switch (colorType) {
    case 0: // Grayscale
      bytesPerPixel = 1;
      break;
    case 2: // RGB
      bytesPerPixel = 3;
      break;
    case 3: // Indexed color (palette)
      bytesPerPixel = 1;
      break;
    case 4: // Grayscale + Alpha
      bytesPerPixel = 2;
      hasAlpha = true;
      break;
    case 6: // RGBA
      bytesPerPixel = 4;
      hasAlpha = true;
      break;
    default:
      throw new Error(`Unsupported PNG color type: ${colorType}`);
  }

  // Parse scanlines and apply filters
  let scanlineLength = width * bytesPerPixel;
  let decompressedPos = 0;
  const pixelData = new Uint8Array(width * height * bytesPerPixel);
  let pixelDataPos = 0;
  let previousScanline: Uint8Array | null = null;

  for (let y = 0; y < height; y++) {
    const filterType = decompressed[decompressedPos];
    decompressedPos++;

    const scanline = new Uint8Array(decompressed.slice(decompressedPos, decompressedPos + scanlineLength));
    decompressedPos += scanlineLength;

    unfilterScanline(scanline, previousScanline, filterType, bytesPerPixel);

    pixelData.set(scanline, pixelDataPos);
    pixelDataPos += scanlineLength;
    previousScanline = scanline;
  }

  // Convert to RGBA format for jsQR
  let imageData: Uint8ClampedArray;

  if (colorType === 6) {
    // Already RGBA
    imageData = new Uint8ClampedArray(pixelData);
  } else if (colorType === 2) {
    // RGB to RGBA
    imageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      imageData[i * 4] = pixelData[i * 3];
      imageData[i * 4 + 1] = pixelData[i * 3 + 1];
      imageData[i * 4 + 2] = pixelData[i * 3 + 2];
      imageData[i * 4 + 3] = 255;
    }
  } else if (colorType === 0) {
    // Grayscale to RGBA
    imageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const gray = pixelData[i];
      imageData[i * 4] = gray;
      imageData[i * 4 + 1] = gray;
      imageData[i * 4 + 2] = gray;
      imageData[i * 4 + 3] = 255;
    }
  } else if (colorType === 4) {
    // Grayscale + Alpha to RGBA
    imageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const gray = pixelData[i * 2];
      const alpha = pixelData[i * 2 + 1];
      imageData[i * 4] = gray;
      imageData[i * 4 + 1] = gray;
      imageData[i * 4 + 2] = gray;
      imageData[i * 4 + 3] = alpha;
    }
  } else if (colorType === 3) {
    // Indexed color - convert to grayscale as fallback
    imageData = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const idx = pixelData[i];
      const val = idx;
      imageData[i * 4] = val;
      imageData[i * 4 + 1] = val;
      imageData[i * 4 + 2] = val;
      imageData[i * 4 + 3] = 255;
    }
  } else {
    throw new Error(`Unsupported PNG color type: ${colorType}`);
  }

  return {
    width,
    height,
    data: imageData,
  };
}
