export interface Newable {
  toBytes(): Uint8Array;
  id: string;
}

export interface NewableStatic {
  new (...args: any[]): Newable;

  fromBytes(bytes: Uint8Array): [Newable, Uint8Array];
}

export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}
