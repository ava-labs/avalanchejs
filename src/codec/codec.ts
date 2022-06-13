import { merge } from '../utils/buffer';
import { configs, pack, unpack } from '../utils/struct';
import type { Serializable, SerializableStatic } from '../common/types';

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

    const idBuff = pack([[id, configs.int]]);

    return merge([idBuff, type.toBytes()]);
  }

  UnpackPrefix(buf: Uint8Array) {
    let typeId: number;
    [typeId, buf] = unpack<[number]>(buf, [configs.int]);

    const type = this.typeIdToType[typeId];
    if (type === undefined) {
      throw new Error(
        `couldn't unmarshal interface: unknown type ID ${typeId}`,
      );
    }

    return type.fromBytes(buf);
  }
}
