import type { Codec } from '../codec';

export interface Serializable {
  id: string;

  toBytes(codec?: Codec): Uint8Array;
}

export interface SerializableStatic {
  new (...args: any[]): Serializable;

  fromBytes(bytes: Uint8Array, codec?: Codec): [Serializable, Uint8Array];
}

export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}

export function serializable() {
  return staticImplements<SerializableStatic>();
}
