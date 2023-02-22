import type { Codec } from '../serializable/codec';
import type { Serializable } from '../serializable/common/types';
import { concatBytes } from './buffer';
import { packList } from './serializeList';

export type FromBytesReturn<T> = T extends {
  fromBytes: (buff: Uint8Array, codec?: Codec) => [infer rType, Uint8Array];
}
  ? rType
  : T extends {
      fromBytes: (buff: Uint8Array, codec: Codec) => [infer rType, Uint8Array];
    }
  ? rType
  : never;

export type ReturnTypes<T extends readonly any[]> = {
  [i in keyof T]: FromBytesReturn<T[i]>;
};

export function unpack<O extends readonly any[]>(
  buffer: Uint8Array,
  sers: O,
  codec?: Codec,
): [...ReturnTypes<O>, Uint8Array] {
  const unpacked = sers.map((ser) => {
    let res: ReturnType<typeof ser.fromBytes>[0];

    if (!buffer.length) {
      throw new Error('not enough bytes');
    }

    [res, buffer] = ser.fromBytes(buffer, codec);

    return res;
  });

  return [...unpacked, buffer] as unknown as [...ReturnTypes<O>, Uint8Array];
}

export function pack(
  serializables: (Serializable | Serializable[])[],
  codec: Codec,
) {
  return concatBytes(
    ...serializables.map((ser) => {
      if (Array.isArray(ser)) {
        return packList(ser, codec);
      }
      return ser.toBytes(codec);
    }),
  );
}

export function packSwitched(
  codec: Codec,
  ...serializables: (Serializable | Serializable[])[]
) {
  return pack(serializables, codec);
}
