import { customInspectSymbol } from '../../../constants/node';
import { base58check } from '../../../utils/base58';
import { hexToBuffer, padLeft } from '../../../utils/buffer';
import { bytesCompare } from '../../../utils/bytesCompare';
import { serializable } from '../../common/types';
import { Primitives } from '../../primitives/primatives';
import { TypeSymbols } from '../../constants';

/**
 * Number of bytes per ID.
 */
export const ID_LEN = 32;

@serializable()
export class Id extends Primitives {
  _type = TypeSymbols.Id;
  constructor(private readonly idVal: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Id, Uint8Array] {
    return [new Id(buf.slice(0, ID_LEN)), buf.slice(ID_LEN)];
  }

  static compare(id1: Id, id2: Id): number {
    return bytesCompare(id1.toBytes(), id2.toBytes());
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toString(), 'string');
  }

  toBytes() {
    return padLeft(this.idVal, ID_LEN);
  }

  toJSON() {
    return this.toString();
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
