import { bufferToHex, parse } from '../../utils';

export const addressesToHexes = (bech32Addresses: string[]) =>
  bech32Addresses.map((addr) => {
    return bufferToHex(parse(addr)[2]);
  });
