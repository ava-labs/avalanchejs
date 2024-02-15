import { customInspectSymbol } from '../../../constants/node';
import { bech32ToBytes, formatBech32 } from '../../../utils/address';
import { bufferToHex, hexToBuffer, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { Primitives } from '../../primitives/primatives';
import { TypeSymbols } from '../../constants';

@serializable()
export class Address extends Primitives {
  _type = TypeSymbols.Address;
  constructor(private readonly address: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Address, Uint8Array] {
    return [new Address(buf.slice(0, 20)), buf.slice(20)];
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toJSON(), 'string');
  }

  toJSON(hrp = 'avax') {
    return this.toString(hrp);
  }

  //decodes from bech32 Addresses
  static fromString(addr: string): Address {
    return new Address(bech32ToBytes(addr));
  }

  static fromHex(hex: string): Address {
    return new Address(hexToBuffer(hex));
  }

  toHex(): string {
    return bufferToHex(this.address);
  }

  toBytes() {
    return padLeft(this.address, 20);
  }

  toString(hrp = 'avax') {
    return formatBech32(hrp, this.address);
  }

  value() {
    return this.toString();
  }
}
