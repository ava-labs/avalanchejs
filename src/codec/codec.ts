import type { Serializable, SerializableStatic } from '../common/types';
import { bytesForInt } from '../fixtures/utils/bytesFor';
import { Int } from '../primatives';
import { concatBytes } from '../utils/buffer';
import { unpack } from '../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/linearcodec/codec.go
 */
export class Codec {
  typeToTypeID: Map<string, number>;

  constructor(private typeIdToType: (SerializableStatic | undefined)[]) {
    this.typeToTypeID = typeIdToType.reduce(
      (agg, type, index) => (type ? agg.set(new type().id, index) : agg),
      new Map<string, number>(),
    );
  }

  PackPrefix(type: Serializable) {
    const id = this.typeToTypeID.get(type.id);
    if (id === undefined) {
      throw new Error("can't marshal unregistered type");
    }

    return concatBytes(bytesForInt(id), type.toBytes());
  }

  UnpackPrefix(buf: Uint8Array) {
    let typeId: Int;
    [typeId, buf] = unpack(buf, [Int]);

    const type = this.typeIdToType[typeId.value()];
    if (type === undefined) {
      throw new Error(
        `couldn't unmarshal interface: unknown type ID ${typeId}`,
      );
    }

    return type.fromBytes(buf);
  }
}
