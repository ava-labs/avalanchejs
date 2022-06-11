import type { Codec } from 'src/codec';

export interface Newable {
  toBytes(): Uint8Array;
  id: string;
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
