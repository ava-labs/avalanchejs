import { configs, unpack } from '../utils/struct';

/**
 * A [SecpTransferOutput] for sending a quantity of an asset to
 * a collection of addresses after a specified unix time.
 *
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-transfer-output
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#secp256k1-transfer-output
 * 
 *
  +-----------+------------+--------------------------------+
  | type_id   : int        |                        4 bytes |
  +-----------+------------+--------------------------------+
  | amount    : long       |                        8 bytes |
  +-----------+------------+--------------------------------+
  | locktime  : long       |                        8 bytes |
  +-----------+------------+--------------------------------+
  | threshold : int        |                        4 bytes |
  +-----------+------------+--------------------------------+
  | addresses : [][20]byte |  4 + 20 * len(addresses) bytes |
  +-----------+------------+--------------------------------+
                           | 28 + 20 * len(addresses) bytes |
                           +--------------------------------+ 
 */

export class SecpTransferOutput {
  constructor(
    private typeID: number,
    private amount: bigint,
    private locktime: bigint,
    private threshold: number,
    private addresses: string[],
  ) {}

  static fromBytes(buff: Uint8Array): SecpTransferOutput {
    const { int, bigInt, addressList } = configs;
    const [typeID, amount, locktime, threshold, addresses] = unpack<
      [number, bigint, bigint, number, string[]]
    >(buff, [int, bigInt, bigInt, int, addressList]);

    return new SecpTransferOutput(
      typeID,
      amount,
      locktime,
      threshold,
      addresses,
    );
  }
}
