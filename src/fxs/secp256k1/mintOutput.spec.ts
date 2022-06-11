import { MintOutput } from '.';
import { mintOutput, mintOutputBytes } from '../../fixtures/secp256k1';

describe('MintOutput', () => {
  /**
   * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-mint-output-example
   */
  it('deserializes correctly', () => {
    const bytes = mintOutputBytes();

    const [output, remainder] = MintOutput.fromBytes(bytes);

    expect(output).toStrictEqual(mintOutput());

    expect(remainder).toStrictEqual(new Uint8Array());
  });
});
