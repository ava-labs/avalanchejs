import { serializable } from '../../common/types';
import { bufferToHex, hexToBuffer, padLeft } from '../../utils/buffer';

@serializable()
export class Id {
  id = 'common.Id';
  constructor(private idVal: string) {}

  static fromBytes(buf: Uint8Array): [Id, Uint8Array] {
    return [new Id(bufferToHex(buf.slice(0, 32))), buf.slice(32)];
  }

  toBytes() {
    return padLeft(hexToBuffer(this.idVal), 32);
  }
}
