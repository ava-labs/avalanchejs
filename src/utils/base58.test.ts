import {
  base58,
  base58check,
  decodeBase58Check,
  maxBase58Length,
} from './base58';
import { describe, it, expect } from 'vitest';

describe('base58', () => {
  it('encodes and decodes correctly', async () => {
    const tests = [
      {
        buffer: new Uint8Array([
          0x00, 0xfe, 0x7b, 0xd0, 0xe0, 0x03, 0x2b, 0x8d, 0x2c, 0x11, 0x56,
          0x84, 0x1f, 0xa0, 0x60, 0x14, 0x56, 0xaa, 0xac, 0x8f, 0x3c, 0x0e,
          0xf1, 0x6d, 0x8c,
        ]),
        string: '1QCaxc8hutpdZ62iKZsn1TCG3nh7uPZojq',
        checksum: '13cp39pSRSMbaxjaXZfFLXuiiK4FHDBQRBm35ab2',
      },
      {
        buffer: new Uint8Array([
          0x00, 0x8b, 0x46, 0xd2, 0x54, 0xa0, 0x83, 0xd1, 0x0c, 0xe3, 0xf1,
          0x2f, 0x5e, 0x95, 0x43, 0xba, 0x73, 0x1f, 0x21, 0xf2, 0xa9, 0x6f,
          0xeb, 0x2a, 0x60,
        ]),
        string: '1DhRmSGnhPjUaVPAj48zgPV9e2oRhAQFUb',
        checksum: '12S5vHShaePQQAXjmjLC87s1Kxi9uM6YEkS2K5Hh',
      },
      {
        buffer: new Uint8Array([
          0x00, 0x45, 0x7a, 0x36, 0xbb, 0x6b, 0xee, 0xe4, 0xea, 0xd3, 0x60,
          0x95, 0x37, 0xda, 0x65, 0x8c, 0x02, 0x62, 0x3e, 0xbe, 0x88, 0x08,
          0x6d, 0x18, 0xc7,
        ]),
        string: '17LN2oPYRYsXS9TdYdXCCDvF2FegshLDU2',
        checksum: '1iSthZt2SDsWS3ELSjFkRsikVNtWDT1GmYzvPQQ',
      },
      {
        buffer: new Uint8Array([
          0x00, 0x28, 0x7a, 0x57, 0xcd, 0xbe, 0x7b, 0x5c, 0xf8, 0x0f, 0x76,
          0x30, 0x9b, 0x29, 0x75, 0x6d, 0x25, 0x86, 0x60, 0x07, 0x2b, 0x30,
          0xda, 0x67, 0x7b,
        ]),
        string: '14h2bDLZSuvRFhUL45VjPHJcW667mmRAAn',
        checksum: '1R9XA3AmWSAkSF6krDfnDmLjMQbtuz7ED7jDMbt',
      },
    ];

    for (const { buffer, string, checksum } of tests) {
      expect(base58.encode(buffer)).toEqual(string);
      expect(base58.decode(string)).toEqual(buffer);
      expect(base58check.encode(buffer)).toEqual(checksum);
      expect(base58check.decode(checksum)).toEqual(buffer);
    }
  });
});

describe('base58check integrity', () => {
  // A genuine 32-byte identifier, produced by the encoder itself.
  const valid = base58check.encode(new Uint8Array(32).fill(7));

  it('rejects a string whose checksum does not match the payload', () => {
    // Flip one character of the payload. Base58-decodes fine, but the
    // trailing 4 bytes no longer equal sha256(payload)[-4:]. Before the
    // checksum was verified this silently produced a *different* 32-byte id,
    // which then got embedded in a transaction the user signs.
    const corrupted = (valid[0] === 'a' ? 'b' : 'a') + valid.slice(1);

    expect(() => base58check.decode(corrupted)).toThrow(/checksum mismatch/);
  });

  it('rejects a string that decodes to fewer bytes than the checksum', () => {
    // '' and '1' previously yielded an empty payload, which Id zero-extended
    // into the all-zero id, i.e. the Primary Network / P-Chain ID.
    expect(() => base58check.decode('')).toThrow(/at least 4/);
    expect(() => base58check.decode('1')).toThrow(/at least 4/);
  });

  it('round-trips a valid payload unchanged', () => {
    const payload = new Uint8Array(32).fill(7);
    expect(base58check.decode(base58check.encode(payload))).toEqual(payload);
  });
});

describe('decodeBase58Check bounds', () => {
  it('rejects an oversized string before decoding it', () => {
    // base58 decoding is O(n^2) in the string length, so an unbounded
    // node- or dApp-supplied identifier lets the attacker choose how long the
    // single JS thread blocks. The length check must run *before* the decode.
    const huge = 'z'.repeat(50_000);

    const started = Date.now();
    expect(() => decodeBase58Check(huge, 32)).toThrow(/expected at most/);
    // Unbounded, decoding 200k base58 characters takes many seconds.
    expect(Date.now() - started).toBeLessThan(1_000);
  });

  it('rejects a payload that is not the expected width', () => {
    const twentyBytes = base58check.encode(new Uint8Array(20).fill(3));

    expect(() => decodeBase58Check(twentyBytes, 32)).toThrow(/expected 32/);
    expect(decodeBase58Check(twentyBytes, 20)).toHaveLength(20);
  });

  it('maxBase58Length bounds the real encoder', () => {
    for (const width of [20, 24, 32, 36]) {
      const encoded = base58.encode(new Uint8Array(width).fill(0xff));
      expect(encoded.length).toBeLessThanOrEqual(maxBase58Length(width));
    }
  });
});
