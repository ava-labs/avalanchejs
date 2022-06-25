import { concatBytes } from '../utils/buffer';
import type { Serializable, SerializableStatic } from '../common/types';
import { serializable } from '../common/types';
import { bytesForInt } from '../fixtures/utils/bytesFor';
import { Int } from '../primitives';
import { unpack } from '../utils/struct';

const _symbol = Symbol('codec');

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/linearcodec/codec.go
 */
@serializable()
export class Codec {
  _type = _symbol;
  typeToTypeID: Map<symbol, number>;

  constructor(private typeIdToType: (SerializableStatic | undefined)[]) {
    this.typeToTypeID = typeIdToType.reduce(
      (agg, type, index) => (type ? agg.set(new type()._type, index) : agg),
      new Map<symbol, number>(),
    );
  }

  PackPrefix = (type: Serializable) => {
    const id = this.typeToTypeID.get(type._type);
    if (id === undefined) {
      throw new Error("can't marshal unregistered type");
    }

    return concatBytes(bytesForInt(id), type.toBytes(this));
  };

  UnpackPrefix = (buf: Uint8Array) => {
    let typeId: Int;
    [typeId, buf] = unpack(buf, [Int]);

    const type = this.typeIdToType[typeId.value()];
    if (type === undefined) {
      throw new Error(
        `couldn't unmarshal interface: unknown type ID ${typeId.value()}`,
      );
    }

    return type.fromBytes(buf, this);
  };

  static fromBytes(buf: Uint8Array, codec?: Codec) {
    if (!codec) {
      throw new Error('codec required');
    }
    return codec.UnpackPrefix(buf);
  }

  // this is placed here to satisfy serializable and should not be used directly
  toBytes(codec: Codec): Uint8Array {
    throw new Error('not implemented');
  }

  PackPrefixList(list: Serializable[]): Uint8Array {
    return concatBytes(
      bytesForInt(list.length),
      ...list.map((type) => this.PackPrefix(type)),
    );
  }
}
