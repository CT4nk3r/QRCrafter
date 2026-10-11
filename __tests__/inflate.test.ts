import { deflateSync } from 'zlib';
import { inflate } from '../shared/inflate';

function roundTrip(data: Uint8Array, level: number) {
  const compressed = new Uint8Array(deflateSync(data, { level }));
  expect(Array.from(inflate(compressed))).toEqual(Array.from(data));
}

describe('inflate', () => {
  const text = new TextEncoder().encode(
    'hello hello hello hello world! '.repeat(200),
  );
  const noise = Uint8Array.from(
    { length: 5000 },
    (_, i) => (i * 7919 + (i >> 3) * 31) & 0xff,
  );
  const empty = new Uint8Array(0);

  it.each([0, 1, 6, 9])('round-trips text at level %i', level =>
    roundTrip(text, level),
  );
  it.each([0, 1, 6, 9])('round-trips noise at level %i', level =>
    roundTrip(noise, level),
  );
  it('round-trips empty input', () => roundTrip(empty, 6));

  it('round-trips highly repetitive data (overlapping copies)', () =>
    roundTrip(new Uint8Array(100000).fill(65), 9));

  it('rejects a bad header', () => {
    expect(() => inflate(new Uint8Array([0, 0, 0, 0]))).toThrow();
  });

  it('rejects truncated data', () => {
    const compressed = new Uint8Array(deflateSync(text));
    expect(() =>
      inflate(compressed.subarray(0, compressed.length >> 1)),
    ).toThrow();
  });
});
