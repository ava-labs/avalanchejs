import * as struct from '../utils/struct';

export class Output {
  // +----------+------+------------------------+
  // | outputId : int  |                4 bytes |
  // +----------+------+------------------------+
  // | output   : TODO |     size(output) bytes |
  // +----------+------+------------------------+
  //                   | 4 + size(output) bytes |
  //                   +------------------------+
  outputId: number;
  output: SecpTransferOutput;

  constructor(buffer: Uint8Array) {
    [this.outputId, buffer] = struct.unpackv2('n', buffer);

    switch (this.outputId) {
      case 7: // TODO: don't hardcode this
        this.output = new SecpTransferOutput(buffer);
        break;
      default:
        throw new Error(`unsupported outputId: ${this.outputId}`);
    }
  }
}

export class OutputOwners {
  // +-----------+------------+---------------------------------+
  // | locktime  : long       |                         8 bytes |
  // +-----------+------------+---------------------------------+
  // | threshold : int        |                         4 bytes |
  // +-----------+------------+---------------------------------+
  // | addresses : [][20]byte |   4 + 20 * len(addresses) bytes |
  // +-----------+------------+---------------------------------+
  //                           | 16 + 20 * len(addresses) bytes |
  //                           +--------------------------------+
  locktime: bigint;
  threshold: number;
  addresses: ArrayBuffer[];

  constructor(buffer: Uint8Array) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    [this.locktime, this.threshold, this.addresses, buffer] = struct.unpackv2<
      [bigint, number, string[]]
    >('unra', buffer);
  }
}


/**
 * [Utxo] is a standalone representation of a transaction output.
 *
 * @see https://docs.avax.network/specs/coreth-atomic-transaction-serialization/#gantt-utxo-specification
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#gantt-utxo-specification
 * @see https://docs.avax.network/specs/platform-transaction-serialization/#gantt-utxo-specification
 */
export class Utxo {
  // +--------------+----------+-------------------------+
  // | codecId      : uint16   |                 2 bytes |
  // +--------------+----------+-------------------------+
  // | txId         : [32]byte |                32 bytes |
  // +--------------+----------+-------------------------+
  // | outputIdx    : int      |                 4 bytes |
  // +--------------+----------+-------------------------+
  // | assetId      : [32]byte |                32 bytes |
  // +--------------+----------+-------------------------+
  // | output       : Output   |      size(output) bytes |
  // +--------------+----------+-------------------------+
  //                           | 70 + size(output) bytes |
  //                           +-------------------------+
  codecId: number;
  txId: Uint8Array;
  outputIdx: number;
  assetId: Uint8Array;
  output: Output;

  constructor(buffer: Uint8Array) {
    [this.codecId, buffer] = struct.unpack('c', buffer); // eslint-disable-line @typescript-eslint/no-unsafe-assignment

    switch (this.codecId) {
      case 0:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        [this.txId, this.outputIdx, this.assetId, buffer] = struct.unpack(
          'ini',
          buffer,
        );
        this.output = new Output(buffer);
        break;
      default:
        throw new Error(`Unsupported codec: ${this.codecId}`);
    }
  }
}
