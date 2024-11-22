import { bytesForInt } from '../fixtures/utils/bytesFor';
import type { Codec } from '../serializable/codec';
import type {
  Serializable,
  SerializableStatic,
} from '../serializable/common/types';
import { Int } from '../serializable/primitives/int';
import { concatBytes } from './buffer';

type unpackFunc = (buf: Uint8Array, codec: Codec) => [any, Uint8Array];

export const unpackList = <T extends SerializableStatic>(
  buf: Uint8Array,
  serializable: T,
  codec: Codec,
): [ReturnType<T['fromBytes']>[0][], Uint8Array] => {
  return unpackListForEach(buf, serializable.fromBytes, codec);
};

export const unpackListForEach = <T extends unpackFunc>(
  buf: Uint8Array,
  callback: T,
  codec: Codec,
): [ReturnType<T>[0][], Uint8Array] => {
  let len;
  [len, buf] = Int.fromBytes(buf);
  const result: ReturnType<T>[0][] = [];
  for (let i = 0; i < len.value(); i++) {
    if (buf.length === 0) {
      throw new Error('not enough bytes');
    }
    let res: any;
    [res, buf] = callback(buf, codec);
    result.push(res);
  }
  return [result, buf];
};

export const toListStruct = <T extends SerializableStatic>(
  serializable: T,
) => ({
  fromBytes: (buff: Uint8Array, codec: Codec) =>
    unpackList(buff, serializable, codec),
});

export const unpackCodecList = {
  fromBytes: (
    buff: Uint8Array,
    codec?: Codec,
  ): [Serializable[], Uint8Array] => {
    if (!codec) throw new Error('codec required when using unpackCodecList');
    return unpackListForEach(buff, codec.UnpackPrefix, codec);
  },
};

export const packList = (
  serializables: readonly Serializable[],
  codec: Codec,
): Uint8Array => {
  return concatBytes(
    bytesForInt(serializables.length),
    ...serializables.map((ser) => ser.toBytes(codec)),
  );
};
