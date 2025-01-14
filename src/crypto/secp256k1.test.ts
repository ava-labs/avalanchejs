import { sha256 } from '@noble/hashes/sha256';
import { describe, it, expect } from 'vitest';

import { base58check } from '../utils/base58';
import { bufferToHex, hexToBuffer } from '../utils/buffer';
import * as secp256k1 from './secp256k1';

describe('secp256k1', function () {
  it('works correctly', async () => {
    const key = '24jUJ9vZexUM6expyMcT48LBx27k1m7xpraoV62oSQAHdziao5';
    const privKey = base58check.decode(key);
    const pubKey = secp256k1.getPublicKey(privKey);

    expect(
      base58check.encode(secp256k1.publicKeyBytesToAddress(pubKey)),
    ).toEqual('Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf');

    const tests = [
      {
        msg: 'hello world',
        sig: new Uint8Array([
          0x17, 0x8c, 0xb6, 0x09, 0x6b, 0x3c, 0xa5, 0x82, 0x0a, 0x4c, 0x6e,
          0xce, 0xdf, 0x15, 0xb6, 0x8b, 0x6f, 0x50, 0xe2, 0x52, 0xc2, 0xb6,
          0x4f, 0x37, 0x74, 0x88, 0x86, 0x02, 0xcc, 0x9f, 0xa0, 0x8c, 0x5d,
          0x01, 0x9d, 0x82, 0xfd, 0xde, 0x95, 0xfd, 0xf2, 0x34, 0xaa, 0x2d,
          0x12, 0xad, 0x79, 0xb5, 0xab, 0xb3, 0x45, 0xfe, 0x95, 0x3a, 0x9f,
          0x72, 0xf7, 0x09, 0x14, 0xfd, 0x31, 0x39, 0x06, 0x3b, 0x00,
        ]),
      },
      {
        msg: 'scooby doo',
        sig: new Uint8Array([
          0xc2, 0x57, 0x3f, 0x29, 0xb0, 0xd1, 0x7a, 0xe7, 0x00, 0x9a, 0x9f,
          0x17, 0xa4, 0x55, 0x8d, 0x32, 0x46, 0x2e, 0x5b, 0x8d, 0x05, 0x9e,
          0x38, 0x32, 0xec, 0xb0, 0x32, 0x54, 0x1a, 0xbc, 0x7d, 0xaf, 0x57,
          0x51, 0xf9, 0x6b, 0x85, 0x71, 0xbc, 0xb7, 0x18, 0xd2, 0x6b, 0xe8,
          0xed, 0x8d, 0x59, 0xb0, 0xd6, 0x03, 0x69, 0xab, 0x57, 0xac, 0xc0,
          0xf7, 0x13, 0x3b, 0x21, 0x94, 0x56, 0x03, 0x8e, 0xc7, 0x01,
        ]),
      },
      {
        msg: 'a really long string',
        sig: new Uint8Array([
          0x1b, 0xf5, 0x61, 0xc3, 0x60, 0x07, 0xd2, 0xa6, 0x12, 0x68, 0xe9,
          0xe1, 0x3a, 0x90, 0x2a, 0x9c, 0x2b, 0xa4, 0x3e, 0x28, 0xf8, 0xd4,
          0x75, 0x54, 0x21, 0x57, 0x11, 0xdc, 0xdc, 0xc6, 0xd3, 0x5e, 0x78,
          0x43, 0x18, 0xf6, 0x22, 0x91, 0x37, 0x3c, 0x95, 0x77, 0x9f, 0x67,
          0x94, 0x91, 0x0a, 0x44, 0x16, 0xbf, 0xa3, 0xae, 0x9f, 0x25, 0xfa,
          0x34, 0xa0, 0x14, 0xea, 0x9c, 0x6f, 0xe0, 0x20, 0x37, 0x00,
        ]),
      },
    ];

    for (const test of tests) {
      const hash = sha256(test.msg);

      await expect(secp256k1.sign(test.msg, privKey)).resolves.toEqual(
        test.sig,
      );
      await expect(secp256k1.signHash(hash, privKey)).resolves.toEqual(
        test.sig,
      );
      expect(secp256k1.recoverPublicKey(hash, test.sig)).toEqual(pubKey);
      expect(secp256k1.verify(test.sig, hash, pubKey)).toEqual(true);
    }
  });

  it('works with EVM', () => {
    const publicKey = hexToBuffer(
      '04e68acfc0253a10620dff706b0a1b1f1f5833ea3beb3bde2250d5f271f3563606672ebc45e0b7ea2e816ecb70ca03137b1c9476eec63d4632e990020b7b6fba39',
    );

    const ethAddrKey = bufferToHex(secp256k1.publicKeyToEthAddress(publicKey));
    expect(ethAddrKey).toBe(
      '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1'.toLocaleLowerCase(),
    );
  });
});
