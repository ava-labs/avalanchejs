import { MintOutput } from '.';
import { mintOutput, mintOutputBytes } from '../../fixtures/secp256k1';

describe('MintOutput', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = MintOutput.fromBytes(mintOutputBytes());

    expect(output).toStrictEqual(mintOutput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(mintOutput().toBytes()).toStrictEqual(mintOutputBytes());
  });
});
