import { configs, unpackv2 } from '../utils/struct';

/**
 * A secp256k1 mint output is an output that is owned by a collection of addresses.
 *
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-mint-output
 * 
 *
+-----------+------------+--------------------------------+
| type_id   : int        |                       4 bytes  |
+-----------+------------+--------------------------------+
| locktime  : long       |                       8 bytes  |
+-----------+------------+--------------------------------+
| threshold : int        |                       4 bytes  |
+-----------+------------+--------------------------------+
| addresses : [][20]byte |  4 + 20 * len(addresses) bytes |
+-----------+------------+--------------------------------+
                         | 20 + 20 * len(addresses) bytes |
                         +--------------------------------+
 */

export interface SecpMintOutput {
  typeID: number;
  locktime: bigint;
  threashold: number;
  addresses: string[];
}

export const secpMintOutputFromBytes = (buff: Uint8Array): SecpMintOutput => {
  const { int, bigInt, addressList } = configs;
  const [typeID, locktime, threashold, addresses] = unpackv2<
    [number, bigint, number, string[]]
  >(buff, [int, bigInt, int, addressList]);
  return {
    typeID,
    locktime,
    threashold,
    addresses,
  };
};
