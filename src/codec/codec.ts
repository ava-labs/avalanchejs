import { Newable, NewableStatic } from '../common/types';
import {
  MintOutput as NFTMintOutput,
  TransferOutput as NFTTransferOutput,
} from '../fxs/nft';
import {
  MintOutput as SecpMintOutput,
  TransferOutput as SecpTransferOutput,
} from '../fxs/secp256k1';
import { bufferToNumber, merge } from '../utils/buffer';
import { configs, pack } from '../utils/struct';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/linearcodec/codec.go
 */
export class Codec {
  typeIdToType = new Map<number, NewableStatic>();
  typeToTypeID = new Map<string, number>();
  nextTypeID = 0;

  constructor(types: Map<number, NewableStatic> = new Map()) {
    this.typeIdToType = types;
    this.typeToTypeID = new Map<string, number>(
      Array.from(types.entries()).map(([id, newable]) => [
        new newable().id,
        id,
      ]),
    );
  }

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

    const idBuff = pack([[id, configs.int]]);

    return merge([idBuff, type.toBytes()]);
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

export const codec0 = new Codec(
  new Map<number, NewableStatic>([
    [6, SecpMintOutput],
    [7, SecpTransferOutput],
    [10, NFTMintOutput],
    [11, NFTTransferOutput],
  ]),
);
