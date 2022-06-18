import { Codec } from '.';
import { outputOwner, outputOwnerBytes } from '../fixtures/secp256k1';
import { bytesForInt } from '../fixtures/utils/bytesFor';
import { MintOutput, OutputOwners } from '../fxs/secp256k1';
import { merge } from '../utils/buffer';

describe('Codec', () => {
  let testCodec: Codec;
  beforeEach(() => {
    testCodec = new Codec([MintOutput, OutputOwners]);
  });

  it('unpacks types correctly', () => {
    const bytes = merge([bytesForInt(1), outputOwnerBytes()]);

    const [out, remainder] = testCodec.UnpackPrefix(bytes);

    expect(out).toStrictEqual(outputOwner());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('packs types correctly', () => {
    const owners = outputOwner();
    const bytes = merge([bytesForInt(1), outputOwnerBytes()]);

    expect(testCodec.PackPrefix(owners)).toStrictEqual(bytes);
  });
});
