import type { Codec } from '../codec';
import type { Serializable, SerializableStatic } from '../common/types';
import { concatBytes } from './buffer';

type FuncsForOutput<T> = T extends {
  fromBytes: (buff: Uint8Array, codec?: Codec) => [infer rType, Uint8Array];
}
  ? rType
  : never;

type ConstructorReturnType<T> = T extends {
  new (...args: any[]): infer rType;
}
  ? rType
  : never;

export type ReturnTypes<T extends readonly any[]> = {
  [i in keyof T]: FuncsForOutput<T[i]>;
};

export function unpack<O extends readonly any[]>(
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
  return concatBytes(...serializables.map((ser) => ser.toBytes()));
}

export function unpackV2<
  O extends readonly any[],
  T extends SerializableStatic,
>(
  buf: Uint8Array,
  sers: O,
  outerClass: T,
  codec?: Codec,
): [ConstructorReturnType<T>, Uint8Array] {
  const results = unpack(buf, sers, codec);
  return [
    new outerClass(...results.slice(0, -1)),
    results[results.length - 1],
  ] as unknown as [ConstructorReturnType<T>, Uint8Array];
}
