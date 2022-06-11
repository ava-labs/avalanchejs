import { MintOperation } from '.';
import { mintOperation, mintOperationBytes } from '../../fixtures/secp256k1';

describe('MintOperation', () => {
  it('deserializes correctly', () => {
    const [operation, remainder] = MintOperation.fromBytes(
      mintOperationBytes(),
    );

    expect(operation).toStrictEqual(mintOperation());

    expect(remainder).toStrictEqual(new Uint8Array());
  });

  it('serializes correctly', () => {
    expect(mintOperation().toBytes()).toStrictEqual(mintOperationBytes());
  });
});
