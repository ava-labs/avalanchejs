import { Newable, NewableStatic } from '../../common/types';
import { testCodec } from '../codec';

export const testSerialization = (
  name: string,
  entity: NewableStatic,
  entityFixture: () => Newable,
  bytesFixture: () => Uint8Array,
) => {
  describe(name, () => {
    it('deserializes correctly', () => {
      const [output, remainder] = entity.fromBytes(bytesFixture(), testCodec());
      expect(output).toStrictEqual(entityFixture());
      expect(remainder).toStrictEqual(new Uint8Array());
    });
  });
  describe(name, () => {
    it('serializes correctly', () => {
      expect(entityFixture().toBytes(testCodec())).toStrictEqual(
        bytesFixture(),
      );
    });
  });
};
