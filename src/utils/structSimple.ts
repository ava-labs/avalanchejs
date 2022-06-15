import type { Codec } from '../codec';
import type { Serializable } from '../common/types';
import { merge } from './buffer';

type FuncsForOutput<T> = T extends {
  fromBytes: (buff: Uint8Array, codec?: Codec) => [infer rType, Uint8Array];
}
  ? rType
  : never;

export type ReturnTypes<T extends readonly any[]> = {
  [i in keyof T]: FuncsForOutput<T[i]>;
};

export function unpackSimple<O extends readonly any[]>(
  buffer: Uint8Array,
  sers: O,
  codec?: Codec,
): [...ReturnTypes<O>, Uint8Array] {
  const unpacked = sers.map((ser) => {
    let res: ReturnType<typeof ser.fromBytes>[0];
    [res, buffer] = ser.fromBytes(buffer, codec);
    return res;
  });

  return [...unpacked, buffer] as unknown as [...ReturnTypes<O>, Uint8Array];
}

export function packSimple(...serializables: Serializable[]) {
  return merge(serializables.map((ser) => ser.toBytes()));
}
