import { customInspectSymbol } from '../../../constants/node';
import { base58check, decodeBase58Check } from '../../../utils/base58';
import {
  hexToBuffer,
  padLeftStrict,
  requireBytes,
} from '../../../utils/buffer';
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
    requireBytes(buf, ID_LEN, 'Id');
    return [new Id(buf.slice(0, ID_LEN)), buf.subarray(ID_LEN)];
  }

  static compare(id1: Id, id2: Id): number {
    return bytesCompare(id1.toBytes(), id2.toBytes());
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toString(), 'string');
  }

  toBytes() {
    return padLeftStrict(this.idVal, ID_LEN, 'Id');
  }

  toJSON() {
    return this.toString();
  }

  toString() {
    return base58check.encode(this.toBytes());
  }

  static fromString(str: string) {
    // Bounded and exact: decodeBase58Check rejects an oversized string before
    // paying the quadratic base58 decode, verifies the checksum, and requires
    // exactly ID_LEN bytes.
    //
    // No padding is needed here. base58 encodes each leading zero byte as a
    // '1', so a genuine CB58 identifier always decodes back to the full 32
    // bytes (the all-zero PlatformChainID included) — only the *string* gets
    // shorter. Left padding a short payload would therefore silently repair a
    // truncated identifier into a different, valid-looking one.
    return new Id(decodeBase58Check(str, ID_LEN));
  }

  static fromHex(hex: string): Id {
    return new Id(hexToBuffer(hex));
  }

  value() {
    return this.toString();
  }
}
