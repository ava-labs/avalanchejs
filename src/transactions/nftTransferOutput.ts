/**
 * An NFT transfer output contains a TypeID, GroupID, Payload, Locktime, Threshold, and Addresses.
 *
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#nft-transfer-output
 * 
 *
+-----------+------------+-------------------------------+
| type_id   : int        |                       4 bytes |
+-----------+------------+-------------------------------+
| group_id  : int        |                       4 bytes |
+-----------+------------+-------------------------------+
| payload   : []byte     |        4 + len(payload) bytes |
+-----------+------------+-------------------------------+
| locktime  : long       |                       8 bytes |
+-----------+------------+-------------------------------+
| threshold : int        |                       4 bytes |
+-----------+------------+-------------------------------+
| addresses : [][20]byte | 4 + 20 * len(addresses) bytes |
+-----------+------------+-------------------------------+
                         |             28 + len(payload) |
                         |  + 20 * len(addresses) bytes  |
                         +-------------------------------+
 */

import { configs, unpackv2 } from '../utils/struct';

export class NftTransferOutput {
  constructor(
    private typeID: number,
    private groupId: number,
    private payload: Uint8Array,
    private locktime: bigint,
    private threshold: number,
    private addresses: string[],
  ) {}

  static fromBytes(buff: Uint8Array): NftTransferOutput {
    const { int, bigInt, addressList, byteList } = configs;
    const [typeID, groupId, payload, locktime, threashold, addresses] =
      unpackv2<[number, number, Uint8Array, bigint, number, string[]]>(buff, [
        int,
        int,
        byteList,
        bigInt,
        int,
        addressList,
      ]);

    return new NftTransferOutput(
      typeID,
      groupId,
      payload,
      locktime,
      threashold,
      addresses,
    );
  }
}
