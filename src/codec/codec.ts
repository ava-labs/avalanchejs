import { Newable, NewableStatic } from '../common/types';
import { bufferToNumber, merge } from '../utils/buffer';
import { configs, pack } from '../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/linearcodec/codec.go
 */
export class Codec {
  typeToTypeID: Map<string, number>;

  constructor(private typeIdToType: (NewableStatic | undefined)[]) {
    this.typeToTypeID = typeIdToType.reduce(
      (agg, type, index) => (type ? agg.set(new type().id, index) : agg),
      new Map<string, number>(),
    );
  }

  PackPrefix(type: Newable) {
    const id = this.typeToTypeID.get(type.id);
    if (id === undefined) {
      throw new Error("can't marshal unregistered type");
    }

    const idBuff = pack([[id, configs.int]]);

    return merge([idBuff, type.toBytes()]);
  }

  UnpackPrefix(buf: Uint8Array) {
    const typeId = bufferToNumber(buf.slice(0, 4));

    const type = this.typeIdToType[typeId];
    if (type === undefined) {
      throw new Error(
        `couldn't unmarshal interface: unknown type ID ${typeId}`,
      );
    }

    return type.fromBytes(buf.slice(4));
  }
}
