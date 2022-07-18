import { DEFAULT_CODEC_VERSION } from '../../constants/codec';
import { concatBytes } from '../../utils/buffer';
import type { FromBytesReturn } from '../../utils/struct';
import { unpack } from '../../utils/struct';
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

  unpackCodec = <T extends SerializableStatic>(
    buff: Uint8Array,
    unpacker: T,
  ): FromBytesReturn<T> => {
    const [codecId, rest] = unpack(buff, [Short]);
    const codec = this.getCodecForVersion(codecId);
    // TODO: try to do this without casting
    return unpacker.fromBytes(rest, codec)[0] as FromBytesReturn<T>;
  };

  getCodecForVersion(codecId: Short): Codec {
    if (!this.codecs[codecId.value()]) {
      throw new Error('codec id not found');
    }
    return this.codecs[codecId.value()];
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
