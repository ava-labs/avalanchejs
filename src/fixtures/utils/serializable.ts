import { Codec } from '../../codec';
import type { Serializable, SerializableStatic } from '../../common/types';
import { testCodec } from '../codec';

export const testSerialization = (
  name: string,
  entity: SerializableStatic,
  entityFixture: () => Serializable,
  bytesFixture: () => Uint8Array,
  codec: () => Codec = testCodec,
) => {
  describe(name, () => {
    it('deserializes correctly', () => {
      const [output, remainder] = entity.fromBytes(bytesFixture(), codec());
      expect(output).toStrictEqual(entityFixture());
      expect(remainder).toStrictEqual(new Uint8Array());
    });
  });

  describe(name, () => {
    it('serializes correctly', () => {
      expect(entityFixture().toBytes(codec())).toStrictEqual(bytesFixture());
    });
  });
};
