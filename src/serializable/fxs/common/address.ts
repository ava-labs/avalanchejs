import { parse } from '../../../utils/address';
import { bufferToHex, hexToBuffer, padLeft } from '../../../utils/buffer';
import { serializable } from '../../common/types';

const _symbol = Symbol('common.Address');

@serializable()
export class Address {
  _type = _symbol;
  constructor(private readonly address: Uint8Array) {}

  static fromBytes(buf: Uint8Array): [Address, Uint8Array] {
    return [new Address(buf.slice(0, 20)), buf.slice(20)];
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
    return bufferToHex(this.address);
  }

  value() {
    return this.toString();
  }
}
