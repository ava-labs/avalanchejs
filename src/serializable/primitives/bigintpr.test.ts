import { describe, it, expect } from 'vitest';
import { bigIntPr, bigIntPrBytes } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { BigIntPr } from './bigintpr';

testSerialization('Bigintpr', BigIntPr, bigIntPr, bigIntPrBytes);

describe('BigIntPr bounds', () => {
  it('encodes the maximum uint64 in 8 bytes', () => {
    expect(new BigIntPr(2n ** 64n - 1n).toBytes()).toStrictEqual(
      new Uint8Array([0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]),
    );
  });

  // An amount above uint64 max used to encode to 9 bytes, shifting every
  // following field in the transaction.
  it('throws rather than emitting an oversized amount field', () => {
    expect(() => new BigIntPr(2n ** 64n).toBytes()).toThrow(
      'BigIntPr is too large for a 8 byte field',
    );
  });

  it('throws on negative amounts', () => {
    expect(() => new BigIntPr(-1n).toBytes()).toThrow(
      'BigIntPr must not be negative',
    );
  });

  it('throws when decoding a short buffer', () => {
    expect(() =>
      BigIntPr.fromBytes(new Uint8Array([0x00, 0x00, 0x05])),
    ).toThrow(
      'unexpected end of input decoding BigIntPr: need 8 bytes, have 3',
    );
  });
});
