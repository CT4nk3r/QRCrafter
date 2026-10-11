/**
 * Minimal zlib/DEFLATE decompressor (RFC 1950 / RFC 1951).
 *
 * Replaces the `pako` dependency for the one thing the app needs: inflating
 * PNG IDAT data on platforms without DecompressionStream (React Native/Hermes).
 */

const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67,
  83, 99, 115, 131, 163, 195, 227, 258,
];
const LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0,
];
const DIST_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
  1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
];
const DIST_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13,
];
const CODE_LENGTH_ORDER = [
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
];

/** Canonical Huffman table: symbols sorted by code, with per-length counts. */
type Huffman = {counts: Uint16Array; symbols: Uint16Array};

function buildHuffman(lengths: ArrayLike<number>): Huffman {
  const counts = new Uint16Array(16);
  for (let i = 0; i < lengths.length; i++) {
    counts[lengths[i]]++;
  }
  counts[0] = 0;

  const offsets = new Uint16Array(16);
  for (let len = 1; len < 15; len++) {
    offsets[len + 1] = offsets[len] + counts[len];
  }

  const symbols = new Uint16Array(lengths.length);
  for (let sym = 0; sym < lengths.length; sym++) {
    if (lengths[sym] !== 0) {
      symbols[offsets[lengths[sym]]++] = sym;
    }
  }
  return {counts, symbols};
}

let fixedTables: {lit: Huffman; dist: Huffman} | null = null;

function getFixedTables() {
  if (!fixedTables) {
    const lit = new Uint8Array(288);
    lit.fill(8, 0, 144);
    lit.fill(9, 144, 256);
    lit.fill(7, 256, 280);
    lit.fill(8, 280, 288);
    fixedTables = {
      lit: buildHuffman(lit),
      dist: buildHuffman(new Uint8Array(30).fill(5)),
    };
  }
  return fixedTables;
}

class Output {
  buf: Uint8Array;
  length = 0;

  constructor(initial: number) {
    this.buf = new Uint8Array(Math.max(initial, 1024));
  }

  private ensure(extra: number) {
    if (this.length + extra <= this.buf.length) {
      return;
    }
    let size = this.buf.length * 2;
    while (size < this.length + extra) {
      size *= 2;
    }
    const next = new Uint8Array(size);
    next.set(this.buf.subarray(0, this.length));
    this.buf = next;
  }

  push(byte: number) {
    this.ensure(1);
    this.buf[this.length++] = byte;
  }

  copy(distance: number, length: number) {
    if (distance > this.length) {
      throw new Error('Invalid deflate stream: distance too far back');
    }
    this.ensure(length);
    // Byte-by-byte on purpose: source and destination may overlap (RLE).
    for (let i = 0; i < length; i++) {
      this.buf[this.length] = this.buf[this.length - distance];
      this.length++;
    }
  }

  append(bytes: Uint8Array) {
    this.ensure(bytes.length);
    this.buf.set(bytes, this.length);
    this.length += bytes.length;
  }
}

class BitReader {
  private pos: number;
  private bitBuf = 0;
  private bitCount = 0;

  constructor(private data: Uint8Array, start: number) {
    this.pos = start;
  }

  bits(n: number): number {
    while (this.bitCount < n) {
      if (this.pos >= this.data.length) {
        throw new Error('Invalid deflate stream: unexpected end of data');
      }
      this.bitBuf |= this.data[this.pos++] << this.bitCount;
      this.bitCount += 8;
    }
    const value = this.bitBuf & ((1 << n) - 1);
    this.bitBuf >>>= n;
    this.bitCount -= n;
    return value;
  }

  decode(table: Huffman): number {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len <= 15; len++) {
      code |= this.bits(1);
      const count = table.counts[len];
      if (code - count < first) {
        return table.symbols[index + (code - first)];
      }
      index += count;
      first = (first + count) << 1;
      code <<= 1;
    }
    throw new Error('Invalid deflate stream: bad Huffman code');
  }

  /** Discard bits up to the next byte boundary and return the byte position. */
  alignToByte(): number {
    this.bitBuf = 0;
    this.bitCount = 0;
    return this.pos;
  }

  skip(bytes: number) {
    this.pos += bytes;
  }
}

function inflateBlock(
  reader: BitReader,
  out: Output,
  lit: Huffman,
  dist: Huffman,
) {
  for (;;) {
    const sym = reader.decode(lit);
    if (sym < 256) {
      out.push(sym);
    } else if (sym === 256) {
      return;
    } else {
      const li = sym - 257;
      if (li >= LENGTH_BASE.length) {
        throw new Error('Invalid deflate stream: bad length symbol');
      }
      const length = LENGTH_BASE[li] + reader.bits(LENGTH_EXTRA[li]);
      const di = reader.decode(dist);
      if (di >= DIST_BASE.length) {
        throw new Error('Invalid deflate stream: bad distance symbol');
      }
      out.copy(DIST_BASE[di] + reader.bits(DIST_EXTRA[di]), length);
    }
  }
}

function readDynamicTables(reader: BitReader) {
  const hlit = reader.bits(5) + 257;
  const hdist = reader.bits(5) + 1;
  const hclen = reader.bits(4) + 4;

  const clLengths = new Uint8Array(19);
  for (let i = 0; i < hclen; i++) {
    clLengths[CODE_LENGTH_ORDER[i]] = reader.bits(3);
  }
  const clTable = buildHuffman(clLengths);

  const lengths = new Uint8Array(hlit + hdist);
  let i = 0;
  while (i < lengths.length) {
    const sym = reader.decode(clTable);
    if (sym < 16) {
      lengths[i++] = sym;
      continue;
    }
    let value = 0;
    let repeat: number;
    if (sym === 16) {
      if (i === 0) {
        throw new Error('Invalid deflate stream: repeat with no previous length');
      }
      value = lengths[i - 1];
      repeat = 3 + reader.bits(2);
    } else if (sym === 17) {
      repeat = 3 + reader.bits(3);
    } else {
      repeat = 11 + reader.bits(7);
    }
    if (i + repeat > lengths.length) {
      throw new Error('Invalid deflate stream: too many code lengths');
    }
    lengths.fill(value, i, i + repeat);
    i += repeat;
  }

  return {
    lit: buildHuffman(lengths.subarray(0, hlit)),
    dist: buildHuffman(lengths.subarray(hlit)),
  };
}

/** Decompress a zlib-wrapped (RFC 1950) DEFLATE stream. */
export function inflate(input: Uint8Array): Uint8Array {
  if (input.length < 2) {
    throw new Error('Invalid zlib stream: too short');
  }
  const cmf = input[0];
  const flg = input[1];
  if ((cmf & 0x0f) !== 8 || ((cmf << 8) | flg) % 31 !== 0) {
    throw new Error('Invalid zlib stream: bad header');
  }
  if (flg & 0x20) {
    throw new Error('Invalid zlib stream: preset dictionary not supported');
  }

  const reader = new BitReader(input, 2);
  const out = new Output(input.length * 4);

  let isFinal = false;
  while (!isFinal) {
    isFinal = reader.bits(1) === 1;
    const type = reader.bits(2);

    if (type === 0) {
      const pos = reader.alignToByte();
      const len = input[pos] | (input[pos + 1] << 8);
      const nlen = input[pos + 2] | (input[pos + 3] << 8);
      if ((len ^ 0xffff) !== nlen || pos + 4 + len > input.length) {
        throw new Error('Invalid deflate stream: bad stored block');
      }
      out.append(input.subarray(pos + 4, pos + 4 + len));
      reader.skip(4 + len);
    } else if (type === 1) {
      const {lit, dist} = getFixedTables();
      inflateBlock(reader, out, lit, dist);
    } else if (type === 2) {
      const {lit, dist} = readDynamicTables(reader);
      inflateBlock(reader, out, lit, dist);
    } else {
      throw new Error('Invalid deflate stream: bad block type');
    }
  }

  return out.buf.slice(0, out.length);
}
