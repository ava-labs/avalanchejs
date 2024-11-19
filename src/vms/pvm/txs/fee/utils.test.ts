import { describe, expect, it } from 'vitest';
import { bitsFromBytesLength, getWarpMessageNumOfSigners } from './utils';
import { warpMessageBytes } from '../../../../fixtures/primitives';
import { Bytes } from '../../../../serializable';

describe('getWarpMessageNumOfSigners()', () => {
  it('should return the expected number of signers from warp message bytes', () => {
    const result = getWarpMessageNumOfSigners(new Bytes(warpMessageBytes()));
    expect(result).toBe(1);
  });
});

describe('bitsFromBytesLength()', () => {
  it('should return expected number of `1` bits from bytes', () => {
    expect(bitsFromBytesLength(new Uint8Array([0]))).toBe(0);
    expect(bitsFromBytesLength(new Uint8Array([1]))).toBe(1);
    expect(bitsFromBytesLength(new Uint8Array([2]))).toBe(1);
    expect(bitsFromBytesLength(new Uint8Array([3]))).toBe(2);
    expect(bitsFromBytesLength(new Uint8Array([4]))).toBe(1);
    expect(bitsFromBytesLength(new Uint8Array([5]))).toBe(2);
    expect(bitsFromBytesLength(new Uint8Array([6]))).toBe(2);
    expect(bitsFromBytesLength(new Uint8Array([7]))).toBe(3);
    expect(bitsFromBytesLength(new Uint8Array([8]))).toBe(1);
    expect(bitsFromBytesLength(new Uint8Array([9]))).toBe(2);

    expect(bitsFromBytesLength(new Uint8Array([0, 0]))).toBe(0);
    expect(bitsFromBytesLength(new Uint8Array([0, 1]))).toBe(1);
    expect(bitsFromBytesLength(new Uint8Array([0, 2]))).toBe(1);
    expect(bitsFromBytesLength(new Uint8Array([0, 3]))).toBe(2);

    expect(bitsFromBytesLength(new Uint8Array([1, 1]))).toBe(2);
    expect(bitsFromBytesLength(new Uint8Array([1, 2]))).toBe(2);
    expect(bitsFromBytesLength(new Uint8Array([1, 3]))).toBe(3);

    expect(bitsFromBytesLength(new Uint8Array([3, 1]))).toBe(3);
    expect(bitsFromBytesLength(new Uint8Array([3, 2]))).toBe(3);
    expect(bitsFromBytesLength(new Uint8Array([3, 3]))).toBe(4);
  });
});
