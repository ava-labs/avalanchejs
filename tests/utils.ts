import * as assert from 'uvu/assert';
import {base58, base58check} from '../src/utils/base58';
import {bufferToNumber} from '../src/utils/buffer';
import {describe} from './setup/env';

describe('base58', (it) => {
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

    for (const {buffer, string, checksum} of tests) {
      assert.equal(base58.encode(buffer), string);
      assert.equal(base58.decode(string), buffer);
      assert.equal(base58check.encode(buffer), checksum);
      assert.equal(base58check.decode(checksum), buffer);
    }
  });
});

describe('bufferToNumber', (it) => {
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

    for (const {buffer, number} of tests) {
      assert.equal(bufferToNumber(buffer), number);
    }
  });
});
