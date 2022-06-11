import { Codec } from '.';
import { MintOutput, OutputOwners } from '../fxs/secp256k1';

describe('Codec', () => {
  it('registers types', () => {
    const c = new Codec();

    c.RegisterType(MintOutput);
    c.RegisterType(OutputOwners);

    expect(c.nextTypeID).toBe(2);
    expect(c.typeIdToType.get(0)).toBe(MintOutput);
    expect(c.typeIdToType.get(1)).toBe(OutputOwners);
  });

  it('unpacks types correctly', () => {
    const bytes = new Uint8Array([
      // type_id:
      0x00, 0x00, 0x00, 0x01,
      // locktime:
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      // threshold:
      0x00, 0x00, 0x00, 0x01,
      // number of addresses:
      0x00, 0x00, 0x00, 0x01,
      // addrs[0]:
      0xda, 0x2b, 0xee, 0x01, 0xbe, 0x82, 0xec, 0xc0, 0x0c, 0x34, 0xf3, 0x61,
      0xed, 0xa8, 0xeb, 0x30, 0xfb, 0x5a, 0x71, 0x5c,
    ]);

    const c = new Codec();

    c.RegisterType(MintOutput);
    c.RegisterType(OutputOwners);

    const [out, remainder] = c.UnpackPrefix(bytes);

    expect(out).toStrictEqual(
      new OutputOwners(0n, 1, ['0xda2bee01be82ecc00c34f361eda8eb30fb5a715c']),
    );

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  // TODO: check rest of the bytes once pack functionality is complete
  it('packs types correctly', () => {
    const c = new Codec();

    c.RegisterType(MintOutput);
    c.RegisterType(OutputOwners);

    const owners = new OutputOwners(0n, 1, [
      '0xda2bee01be82ecc00c34f361eda8eb30fb5a715c',
    ]);

    expect(c.PackPrefix(owners)).toStrictEqual(
      new Uint8Array([
        // Type ID
        0x00, 0x00, 0x00, 0x01,
        // locktime
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        // threshold
        0x00, 0x00, 0x00, 0x01,
        // # of addresses
        0x00, 0x00, 0x00, 0x01,
        // address [0]
        0xda, 0x2b, 0xee, 0x01, 0xbe, 0x82, 0xec, 0xc0, 0x0c, 0x34, 0xf3, 0x61,
        0xed, 0xa8, 0xeb, 0x30, 0xfb, 0x5a, 0x71, 0x5c,
      ]),
    );
  });
});
