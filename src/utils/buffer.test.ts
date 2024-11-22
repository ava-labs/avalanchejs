import {
  bufferToBigInt,
  bufferToNumber,
  hammingWeight,
  padLeft,
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
