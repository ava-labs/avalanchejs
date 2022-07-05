import { sha256 } from '@noble/hashes/sha256';
import { base58check } from './base58';
import * as secp from './secp256k1';

describe('secp256k1', function () {
  it('works correctly', () => {
    const key = '24jUJ9vZexUM6expyMcT48LBx27k1m7xpraoV62oSQAHdziao5';
    const privKey = base58check.decode(key);
    const pubKey = secp.getPublicKey(privKey);

    const tests = [
      {
        msg: 'hello world',
        sig: new Uint8Array([
          23, 140, 182, 9, 107, 60, 165, 130, 10, 76, 110, 206, 223, 21, 182,
          139, 111, 80, 226, 82, 194, 182, 79, 55, 116, 136, 134, 2, 204, 159,
          160, 140, 93, 1, 157, 130, 253, 222, 149, 253, 242, 52, 170, 45, 18,
          173, 121, 181, 171, 179, 69, 254, 149, 58, 159, 114, 247, 9, 20, 253,
          49, 57, 6, 59, 0,
        ]),
      },
      {
        msg: 'scooby doo',
        sig: new Uint8Array([
          194, 87, 63, 41, 176, 209, 122, 231, 0, 154, 159, 23, 164, 85, 141,
          50, 70, 46, 91, 141, 5, 158, 56, 50, 236, 176, 50, 84, 26, 188, 125,
          175, 87, 81, 249, 107, 133, 113, 188, 183, 24, 210, 107, 232, 237,
          141, 89, 176, 214, 3, 105, 171, 87, 172, 192, 247, 19, 59, 33, 148,
          86, 3, 142, 199, 1,
        ]),
      },
      {
        msg: 'a really long string',
        sig: new Uint8Array([
          27, 245, 97, 195, 96, 7, 210, 166, 18, 104, 233, 225, 58, 144, 42,
          156, 43, 164, 62, 40, 248, 212, 117, 84, 33, 87, 17, 220, 220, 198,
          211, 94, 120, 67, 24, 246, 34, 145, 55, 60, 149, 119, 159, 103, 148,
          145, 10, 68, 22, 191, 163, 174, 159, 37, 250, 52, 160, 20, 234, 156,
          111, 224, 32, 55, 0,
        ]),
      },
    ];

    for (const test of tests) {
      const hash = sha256(test.msg);

      expect(secp.sign(test.msg, privKey)).resolves.toEqual(test.sig);
      expect(secp.signHash(hash, privKey)).resolves.toEqual(test.sig);
      expect(secp.recoverPublicKey(hash, test.sig)).toEqual(pubKey);
      expect(secp.verify(test.sig, hash, pubKey)).toEqual(true);
    }
  });
});
