import { OutputOwners } from '.';
import { outputOwner, outputOwnerBytes } from '../../fixtures/secp256k1';

describe('OutputOwners', () => {
  it('deserializes correctly', () => {
    const [output, remainder] = OutputOwners.fromBytes(outputOwnerBytes());

    expect(output).toStrictEqual(outputOwner());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(outputOwner().toBytes()).toStrictEqual(outputOwnerBytes());
  });
});
