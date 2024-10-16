import { bytesForInt } from '../../fixtures/utils/bytesFor';
import { concatBytes } from '../../utils/buffer';
import { unpack } from '../../utils/struct';
import type { Serializable, SerializableStatic } from '../common/types';
import { serializable } from '../common/types';
import { Int } from '../primitives';
import { TypeSymbols } from '../constants';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/linearcodec/codec.go
 */
@serializable()
export class Codec {
  _type = TypeSymbols.Codec;
  typeToTypeID: Map<TypeSymbols, number>;

  constructor(
    private readonly typeIdToType: (SerializableStatic | undefined)[],
  ) {
    this.typeToTypeID = typeIdToType.reduce(
      (agg, type, index) => (type ? agg.set(new type()._type, index) : agg),
      new Map<TypeSymbols, number>(),
    );
  }

  PackPrefix = (type: Serializable) => {
    const id = this.typeToTypeID.get(type._type);
    if (id === undefined) {
      throw new Error(
        `can't marshal unregistered type: ${type._type.toString()}`,
      );
    }

    return concatBytes(bytesForInt(id), type.toBytes(this));
  };

  UnpackPrefix = <T extends Serializable>(buf: Uint8Array): [T, Uint8Array] => {
    let typeId: Int;
    [typeId, buf] = unpack(buf, [Int]);
    const type = this.typeIdToType[typeId.value()];

    if (type === undefined) {
      throw new Error(
        `couldn't unmarshal interface: unknown type ID ${typeId.value()}`,
      );
    }

    const [entity, rest] = type.fromBytes(buf, this);

    return [entity as T, rest];
  };

  static fromBytes(buf: Uint8Array, codec?: Codec) {
    if (!codec) {
      throw new Error('codec required');
    }
    return codec.UnpackPrefix(buf);
  }

  // this is placed here to satisfy serializable and should not be used directly
  toBytes(): Uint8Array {
    throw new Error('not implemented');
  }

  PackPrefixList(list: Serializable[]): Uint8Array {
    return concatBytes(
      bytesForInt(list.length),
      ...list.map((type) => this.PackPrefix(type)),
    );
  }
}
