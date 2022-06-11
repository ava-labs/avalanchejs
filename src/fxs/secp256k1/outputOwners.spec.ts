import { OutputOwners } from '.';
import { outputOwner, outputOwnerBytes } from '../../fixtures/secp256k1';

describe('OutputOwners', () => {
  /**
   * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-output-owners-output
   */
  it('deserializes correctly', () => {
    const bytes = outputOwnerBytes();

    const [output, remainder] = OutputOwners.fromBytes(bytes);

    expect(output).toStrictEqual(outputOwner());

    expect(remainder).toStrictEqual(new Uint8Array());
  });
});
