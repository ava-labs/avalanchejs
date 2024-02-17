import { ProofOfPossession } from './proofOfPossession';

const publicKey = new Uint8Array([
  0x85, 0x02, 0x5b, 0xca, 0x6a, 0x30, 0x2d, 0xc6, 0x13, 0x38, 0xff, 0x49, 0xc8,
  0xba, 0xa5, 0x72, 0xde, 0xd3, 0xe8, 0x6f, 0x37, 0x59, 0x30, 0x4c, 0x7f, 0x61,
  0x8a, 0x2a, 0x25, 0x93, 0xc1, 0x87, 0xe0, 0x80, 0xa3, 0xcf, 0xde, 0xc9, 0x50,
  0x40, 0x30, 0x9a, 0xd1, 0xf1, 0x58, 0x95, 0x30, 0x67,
]);

const signature = new Uint8Array([
  0x8b, 0x1d, 0x61, 0x33, 0xd1, 0x7e, 0x34, 0x83, 0x22, 0x0a, 0xd9, 0x60, 0xb6,
  0xfd, 0xe1, 0x1e, 0x4e, 0x12, 0x14, 0xa8, 0xce, 0x21, 0xef, 0x61, 0x62, 0x27,
  0xe5, 0xd5, 0xee, 0xf0, 0x70, 0xd7, 0x50, 0x0e, 0x6f, 0x7d, 0x44, 0x52, 0xc5,
  0xa7, 0x60, 0x62, 0x0c, 0xc0, 0x67, 0x95, 0xcb, 0xe2, 0x18, 0xe0, 0x72, 0xeb,
  0xa7, 0x6d, 0x94, 0x78, 0x8d, 0x9d, 0x01, 0x17, 0x6c, 0xe4, 0xec, 0xad, 0xfb,
  0x96, 0xb4, 0x7f, 0x94, 0x22, 0x81, 0x89, 0x4d, 0xdf, 0xad, 0xd1, 0xc1, 0x74,
  0x3f, 0x7f, 0x54, 0x9f, 0x1d, 0x07, 0xd5, 0x9d, 0x55, 0x65, 0x59, 0x27, 0xf7,
  0x2b, 0xc6, 0xbf, 0x7c, 0x12,
]);

describe('proofOfPossession', function () {
  it('can init', () => {
    const pop = new ProofOfPossession(publicKey, signature);
    expect(pop instanceof ProofOfPossession).toBe(true);
  });

  it('throws for invalid pubkey', () => {
    expect(() => {
      const popBytes = new Uint8Array([...publicKey, ...signature]);
      popBytes[2] = 0x00;
      ProofOfPossession.fromBytes(popBytes);
    }).toThrow();
  });

  it('throws for invalid signature', () => {
    expect(() => {
      const popBytes = new Uint8Array([...publicKey, ...signature]);
      popBytes[64] = 0x00;
      ProofOfPossession.fromBytes(popBytes);
    }).toThrow();
  });

  it('can call toString', () => {
    const pop = new ProofOfPossession(publicKey, signature);
    const expected = `0x85025bca6a302dc61338ff49c8baa572ded3e86f3759304c7f618a2a2593c187e080a3cfdec95040309ad1f1589530678b1d6133d17e3483220ad960b6fde11e4e1214a8ce21ef616227e5d5eef070d7500e6f7d4452c5a760620cc06795cbe218e072eba76d94788d9d01176ce4ecadfb96b47f942281894ddfadd1c1743f7f549f1d07d59d55655927f72bc6bf7c12`;
    expect(pop.toString()).toEqual(expected);
  });
});
