import type { Serializable, SerializableStatic } from '../../common/types';
import { TransferOutput } from '../../fxs/nft';
import { testCodec } from '../codec';
import { outputOwner, outputOwnerBytes } from '../secp256k1';

export const testSerialization = (
  name: string,
  entity: SerializableStatic,
  entityFixture: () => Serializable,
  bytesFixture: () => Uint8Array,
  options?: {
    //in case its not implemented
    skipToBytes: boolean;
  },
) => {
  describe(name, () => {
    it('deserializes correctly', () => {
      const [output, remainder] = entity.fromBytes(bytesFixture(), testCodec());
      expect(output).toStrictEqual(entityFixture());
      expect(remainder).toStrictEqual(new Uint8Array());
    });
  });
  if (options?.skipToBytes) return;
  describe(name, () => {
    it('serializes correctly', () => {
      expect(entityFixture().toBytes(testCodec())).toStrictEqual(
        bytesFixture(),
      );
    });
  });
};
