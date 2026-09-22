import {
  bufferToBigInt,
  bufferToNumber,
  hammingWeight,
  padLeft,
  padLeftStrict,
  requireBytes,
  toFixedWidthBytes,
} from './buffer';
import { describe, it, expect } from 'vitest';

describe('bufferToBigInt', () => {
  it('converts Uint8Arrays correctly', async () => {
    const tests = [
      {
        buffer: new Uint8Array([0x00, 0x00]),
        number: 0n,
      },
      {
        buffer: new Uint8Array([0x00, 0x00, 0x00, 0x07]),
        number: 7n,
      },
      {
        buffer: new Uint8Array([
          0x00, 0x00, 0x00, 0x00, 0x77, 0x35, 0x94, 0x00,
        ]),
        number: 2_000_000_000n,
      },
    ];

    for (const { buffer, number } of tests) {
      expect(bufferToBigInt(buffer)).toEqual(number);
    }
  });
});

describe('bufferToNumber', () => {
  it('converts Uint8Arrays correctly', async () => {
    const tests = [
      {
        buffer: new Uint8Array([0x00, 0x00]),
        number: 0,
      },
      {
        buffer: new Uint8Array([0x00, 0x00, 0x00, 0x07]),
        number: 7,
      },
      {
        buffer: new Uint8Array([
          0x00, 0x00, 0x00, 0x00, 0x77, 0x35, 0x94, 0x00,
        ]),
        number: 2_000_000_000,
      },
    ];

    for (const { buffer, number } of tests) {
      expect(bufferToNumber(buffer)).toEqual(number);
    }
  });
});

describe('padLeft', () => {
  it('pads to 2 bytes', () => {
    const res = padLeft(new Uint8Array([0x72]), 2);
    expect(res).toStrictEqual(new Uint8Array([0x00, 0x72]));
  });

  it('pads to 4 bytes', () => {
    const res = padLeft(new Uint8Array([0x72]), 4);
    expect(res).toStrictEqual(new Uint8Array([0x00, 0x00, 0x00, 0x72]));
  });

  it('pads to 8 bytes', () => {
    const res = padLeft(new Uint8Array([0x72]), 8);
    expect(res).toStrictEqual(
      new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x72]),
    );
  });

  it('pads if empty array', () => {
    const res = padLeft(new Uint8Array([]), 2);
    expect(res).toStrictEqual(new Uint8Array([0x00, 0x00]));
  });

  it('no-ops if already at size', () => {
    const res = padLeft(new Uint8Array([0xaf, 0x72, 0x72]), 2);
    expect(res).toStrictEqual(new Uint8Array([0xaf, 0x72, 0x72]));
  });
});

describe('hammingWeight()', () => {
  it('should return expected number of `1` bits from bytes', () => {
    expect(hammingWeight(new Uint8Array([0]))).toBe(0);
    expect(hammingWeight(new Uint8Array([1]))).toBe(1);
    expect(hammingWeight(new Uint8Array([2]))).toBe(1);
    expect(hammingWeight(new Uint8Array([3]))).toBe(2);
    expect(hammingWeight(new Uint8Array([4]))).toBe(1);
    expect(hammingWeight(new Uint8Array([5]))).toBe(2);
    expect(hammingWeight(new Uint8Array([6]))).toBe(2);
    expect(hammingWeight(new Uint8Array([7]))).toBe(3);
    expect(hammingWeight(new Uint8Array([8]))).toBe(1);
    expect(hammingWeight(new Uint8Array([9]))).toBe(2);

    expect(hammingWeight(new Uint8Array([0, 0]))).toBe(0);
    expect(hammingWeight(new Uint8Array([0, 1]))).toBe(1);
    expect(hammingWeight(new Uint8Array([0, 2]))).toBe(1);
    expect(hammingWeight(new Uint8Array([0, 3]))).toBe(2);

    expect(hammingWeight(new Uint8Array([1, 1]))).toBe(2);
    expect(hammingWeight(new Uint8Array([1, 2]))).toBe(2);
    expect(hammingWeight(new Uint8Array([1, 3]))).toBe(3);

    expect(hammingWeight(new Uint8Array([3, 1]))).toBe(3);
    expect(hammingWeight(new Uint8Array([3, 2]))).toBe(3);
    expect(hammingWeight(new Uint8Array([3, 3]))).toBe(4);
  });
});

describe('padLeftStrict', () => {
  it('pads like padLeft when the value fits', () => {
    expect(padLeftStrict(new Uint8Array([0x72]), 2)).toStrictEqual(
      new Uint8Array([0x00, 0x72]),
    );
  });

  it('throws instead of returning an oversized field', () => {
    expect(() =>
      padLeftStrict(new Uint8Array([0xaf, 0x72, 0x72]), 2, 'Short'),
    ).toThrow('Short is 3 bytes, expected at most 2');
  });
});

describe('toFixedWidthBytes', () => {
  it('encodes to the exact field width', () => {
    expect(toFixedWidthBytes(13, 4)).toStrictEqual(
      new Uint8Array([0x00, 0x00, 0x00, 0x0d]),
    );
    expect(toFixedWidthBytes(0n, 8)).toStrictEqual(
      new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]),
    );
  });

  it('encodes the maximum value of the field', () => {
    expect(toFixedWidthBytes(2n ** 64n - 1n, 8)).toStrictEqual(
      new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    );
  });

  it('throws when the value overflows the field', () => {
    expect(() => toFixedWidthBytes(2n ** 64n, 8, 'BigIntPr')).toThrow(
      'BigIntPr is too large for a 8 byte field',
    );
    expect(() => toFixedWidthBytes(2 ** 32, 4, 'Int')).toThrow(
      'Int is too large for a 4 byte field',
    );
  });

  it('throws on negative and fractional values', () => {
    expect(() => toFixedWidthBytes(-1, 4, 'Int')).toThrow(
      'Int must not be negative',
    );
    expect(() => toFixedWidthBytes(1.5, 4, 'Int')).toThrow(
      'Int must be an integer',
    );
  });
});

describe('requireBytes', () => {
  it('passes when enough bytes remain', () => {
    expect(() => requireBytes(new Uint8Array(4), 4)).not.toThrow();
    expect(() => requireBytes(new Uint8Array(5), 4)).not.toThrow();
  });

  it('throws when the buffer is short', () => {
    expect(() => requireBytes(new Uint8Array(3), 4, 'Int')).toThrow(
      'unexpected end of input decoding Int: need 4 bytes, have 3',
    );
  });
});
