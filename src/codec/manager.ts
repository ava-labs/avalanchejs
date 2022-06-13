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
}
