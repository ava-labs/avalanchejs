import type { Serializable, SerializableStatic } from '../../common/types';
import { testCodec } from '../codec';

export const testSerialization = (
  name: string,
  entity: SerializableStatic,
  entityFixture: () => Serializable,
  bytesFixture: () => Uint8Array,
  options?: {
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
