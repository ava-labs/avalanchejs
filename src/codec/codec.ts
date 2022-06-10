import { NewableStatic, Newable } from '../common/types';
import { bufferToNumber, merge } from '../utils/buffer';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/linearcodec/codec.go
 */
export class Codec {
  typeIdToType = new Map<number, NewableStatic>();
  typeToTypeID = new Map<string, number>();
  nextTypeID = 0;

  RegisterType(type: NewableStatic) {
    this.typeIdToType.set(this.nextTypeID, type);
    const id = new type().id;
    this.typeToTypeID.set(id, this.nextTypeID);
    this.nextTypeID += 1;
  }

  PackPrefix(type: Newable) {
    const id = this.typeToTypeID.get(type.id);
    if (id === undefined) {
      throw new Error("can't marshal unregistered type");
    }

    const view = new DataView(new ArrayBuffer(4));
    view.setUint32(0, id, false);

    return merge(new Uint8Array(view.buffer), type.toBytes());
  }

  UnpackPrefix(buf: Uint8Array) {
    const typeId = bufferToNumber(buf.slice(0, 4));

    const type = this.typeIdToType.get(typeId);
    if (type === undefined) {
      throw new Error(
        `couldn't unmarshal interface: unknown type ID ${typeId}`,
      );
    }

    return type.fromBytes(buf.slice(4));
  }
}
