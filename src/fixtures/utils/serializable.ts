import type { Codec } from '../../serializable/codec';
import { describe, it, expect } from 'vitest';

import type {
  Serializable,
  SerializableStatic,
} from '../../serializable/common/types';
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
      expect(JSON.stringify(output)).toBe(JSON.stringify(entityFixture()));
      expect(remainder).toStrictEqual(new Uint8Array());
    });
  });

  describe(name, () => {
    it('serializes correctly', () => {
      expect(entityFixture().toBytes(codec())).toStrictEqual(bytesFixture());
    });
  });
};
