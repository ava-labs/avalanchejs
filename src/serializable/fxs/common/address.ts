import { customInspectSymbol } from '../../../constants/node';
import { formatBech32, parse } from '../../../utils/address';
import { hexToBuffer, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { Primitives } from '../../primitives/primatives';

const _symbol = Symbol('common.Address');

@serializable()
export class Address extends Primitives {
  _type = _symbol;
  constructor(private readonly address: Uint8Array) {
    super();
  }

  static fromBytes(buf: Uint8Array): [Address, Uint8Array] {
    return [new Address(buf.slice(0, 20)), buf.slice(20)];
  }

  [customInspectSymbol](_, options: any) {
    return options.stylize(this.toJSON(), 'string');
  }

  toJSON() {
    return this.toString();
  }

  //decodes from bech32 Addresses
  static fromString(addr: string): Address {
    return new Address(parse(addr)[2]);
  }

  static fromHex(hex: string): Address {
    return new Address(hexToBuffer(hex));
  }

  toBytes() {
    return padLeft(this.address, 20);
  }

  toString() {
    return formatBech32('avax', this.address);
  }

  value() {
    return this.toString();
  }
}
