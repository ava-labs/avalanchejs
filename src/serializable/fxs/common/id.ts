import { serializable } from '../../../common/types';
import { bufferToHex, hexToBuffer, padLeft } from '../../../utils/buffer';

const _symbol = Symbol('common.Id');

@serializable()
export class Id {
  _type = _symbol;
  constructor(private readonly idVal: string) {}

  static fromBytes(buf: Uint8Array): [Id, Uint8Array] {
    return [new Id(bufferToHex(buf.slice(0, 32))), buf.slice(32)];
  }

  toBytes() {
    return padLeft(hexToBuffer(this.idVal), 32);
  }

  value() {
    return this.idVal;
  }
}
