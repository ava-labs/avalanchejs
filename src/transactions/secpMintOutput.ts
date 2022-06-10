/**
 * A secp256k1 mint output is an output that is owned by a collection of addresses.
 *
 * @see https://docs.avax.network/specs/avm-transaction-serialization/#secp256k1-mint-output
 *
 */

import { configs, unpack } from '../utils/struct';
import { OutputOwner } from './outputOwner';

export class SecpMintOutput {
  constructor(private typeID: number, private outputOwner: OutputOwner) {}

  static fromBytes(buff: Uint8Array): SecpMintOutput {
    const { int } = configs;
    const [typeID, outputOwner] = unpack<[number, OutputOwner]>(buff, [
      int,
      OutputOwner.unpackerConfig(),
    ]);
    return new SecpMintOutput(typeID, outputOwner);
  }
}
