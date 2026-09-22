import { customInspectSymbol } from '../../../constants/node';
import { bech32ToBytes, formatBech32 } from '../../../utils/address';
import {
  bufferToHex,
  hexToBuffer,
  padLeftStrict,
  requireBytes,
} from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { Primitives } from '../../primitives/primatives';
import { TypeSymbols } from '../../constants';

/**
 * Number of bytes per address.
 */
export const ADDRESS_LEN = 20;

@serializable()
export class Address extends Primitives {
  _type = TypeSymbols.Address;
  constructor(private readonly address: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Address, Uint8Array] {
    requireBytes(buf, ADDRESS_LEN, 'Address');
    return [new Address(buf.slice(0, ADDRESS_LEN)), buf.subarray(ADDRESS_LEN)];
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toJSON(), 'string');
  }

  toJSON(hrp = 'avax') {
    return this.toString(hrp);
  }

  //decodes from bech32 Addresses
  static fromString(addr: string): Address {
    const bytes = bech32ToBytes(addr);

    // Without this a malformed address that decodes short would be left padded
    // at serialization time, silently becoming a different address.
    if (bytes.length !== ADDRESS_LEN) {
      throw new Error(
        `invalid address ${addr}: decoded to ${bytes.length} bytes, expected ${ADDRESS_LEN}`,
      );
    }

    return new Address(bytes);
  }

  static fromHex(hex: string): Address {
    return new Address(hexToBuffer(hex));
  }

  toHex(): string {
    return bufferToHex(this.address);
  }

  toBytes() {
    return padLeftStrict(this.address, ADDRESS_LEN, 'Address');
  }

  toString(hrp = 'avax') {
    return formatBech32(hrp, this.address);
  }

  value() {
    return this.toString();
  }
}
