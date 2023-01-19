import { DEFAULT_CODEC_VERSION } from '../../constants/codec';
import { concatBytes } from '../../utils/buffer';
import type { FromBytesReturn } from '../../utils/struct';
import { unpack } from '../../utils/struct';
import type { Transaction } from '../../vms/common/transaction';
import type { Serializable, SerializableStatic } from '../common/types';
import { Short } from '../primitives';
import type { Codec } from './codec';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/manager.go
 */
export class Manager {
  codecs: Record<number, Codec> = {};
  RegisterCodec(version: number, codec: Codec) {
    if (version in this.codecs) {
      throw new Error('duplicated codec version');
    }

    this.codecs[version] = codec;
  }

  unpack = <T extends SerializableStatic>(
    buff: Uint8Array,
    unpacker: T,
  ): FromBytesReturn<T> => {
    const [codec, rest] = this.getCodecFromBuffer(buff);
    // TODO: try to do this without casting
    return unpacker.fromBytes(rest, codec)[0] as FromBytesReturn<T>;
  };

  unpackTransaction = (buff: Uint8Array): Transaction => {
    const [codec, rest] = this.getCodecFromBuffer(buff);
    return codec.UnpackPrefix<Transaction>(rest)[0];
  };

  public getCodecFromBuffer(buff: Uint8Array): [Codec, Uint8Array] {
    const [codecId, rest] = unpack(buff, [Short]);
    const codec = this.getCodecForVersion(codecId);
    return [codec, rest];
  }

  getCodecForVersion(codecId: Short): Codec {
    if (!this.codecs[codecId.value()]) {
      throw new Error(`codec id(${codecId.value()}) not found`);
    }
    return this.codecs[codecId.value()];
  }

  getDefaultCodec() {
    return this.getCodecForVersion(new Short(DEFAULT_CODEC_VERSION));
  }

  getDefaultCodecId() {
    return new Short(DEFAULT_CODEC_VERSION);
  }

  packCodec(
    serializable: Serializable,
    codecVersion = DEFAULT_CODEC_VERSION,
  ): Uint8Array {
    const codecIdShort = new Short(codecVersion);
    const codec = this.getCodecForVersion(codecIdShort);
    return concatBytes(codecIdShort.toBytes(), codec.PackPrefix(serializable));
  }
}
