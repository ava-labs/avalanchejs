import { bech32 } from '@scure/base';

const addressSep = '-';

// parse takes in an address string and returns an array of
// [chain ID alias, bech32 HRP, address bytes].
export function parse(addrStr: string): [string, string, Uint8Array] {
  const parts = addrStr.split(addressSep);
  if (parts.length < 2) {
    throw new Error(`Invalid address: ${addrStr}`);
  }

  const chainID = parts[0];
  const rawAddr = parts[1];

  const [hrp, addr] = parseBech32(rawAddr);

  return [chainID, hrp, addr];
}

export function bech32ToBytes(addrStr: string): Uint8Array {
  return parse(addrStr)[2];
}

// format takes in a chain ID alias, bech32 HRP, and byte slice to produce a
// string for an address.
export function format(chainIDAlias: string, hrp: string, addr: Uint8Array) {
  const addrStr = formatBech32(hrp, addr);
  return `${chainIDAlias}${addressSep}${addrStr}`;
}

// parseBech32 takes a bech32 address as input and returns the HRP and data
// section of a bech32 address.
export function parseBech32(addrStr: string): [string, Uint8Array] {
  const { prefix, words } = bech32.decode(addrStr);
  return [prefix, bech32.fromWords(words)];
}

// formatBech32 takes an address's bytes as input and returns a bech32 address.
export function formatBech32(hrp: string, payload: Uint8Array) {
  const words = bech32.toWords(payload);
  return bech32.encode(hrp, words);
}
