import { base58check } from '../../../utils/base58';
import { hexToBuffer, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';

const _symbol = Symbol('common.Id');

@serializable()
export class Id {
  _type = _symbol;
  constructor(private readonly idVal: Uint8Array) {}

  static fromBytes(buf: Uint8Array): [Id, Uint8Array] {
    return [new Id(buf.slice(0, 32)), buf.slice(32)];
  }

  toBytes() {
    return padLeft(this.idVal, 32);
  }

  toString() {
    return base58check.encode(this.toBytes());
  }

  static fromString(str: string) {
    return Id.fromBytes(base58check.decode(str))[0];
  }

  static fromHex(hex: string): Id {
    return new Id(hexToBuffer(hex));
  }

  value() {
    return this.toString();
  }
}
