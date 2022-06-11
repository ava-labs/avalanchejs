import type { Codec } from 'src/codec';

export interface Newable {
  id: string;

  toBytes(codec?: Codec): Uint8Array;
}

export interface NewableStatic {
  new (...args: any[]): Newable;

  fromBytes(bytes: Uint8Array, codec?: Codec): [Newable, Uint8Array];
}

export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
