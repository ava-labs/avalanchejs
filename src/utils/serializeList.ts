import type { Codec } from '../codec';
import type { Serializable, SerializableStatic } from '../common/types';
import { Int } from '../primatives/int';
import { concatBytes } from './buffer';

export const unpackList = <T extends SerializableStatic>(
  buf: Uint8Array,
  serializable: T,
): [ReturnType<T['fromBytes']>[0][], Uint8Array] => {
  let len;
  [len, buf] = Int.fromBytes(buf);
  const result: ReturnType<T['fromBytes']>[0][] = [];
  for (let i = 0; i < len.value(); i++) {
    if (buf.length === 0) {
      throw new Error('not enough bytes');
    }
    let res: any;
    [res, buf] = serializable.fromBytes(buf);
    result.push(res);
  }
  return [result, buf];
};

export const packList = (
  serializables: Serializable[],
  codec?: Codec,
): Uint8Array => {
  return concatBytes(
    new Int(serializables.length).toBytes(),
    ...serializables.map((ser) => ser.toBytes(codec)),
  );
};
