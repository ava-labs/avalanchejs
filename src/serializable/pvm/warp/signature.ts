import { hammingWeight } from '../../../utils/buffer';
import { pack, unpack } from '../../../utils/struct';
import type { Codec } from '../../codec';
import { serializable } from '../../common/types';
import { TypeSymbols } from '../../constants';
import { BlsSignature } from '../../fxs/common';
import { Bytes } from '../../primitives';

@serializable()
export class WarpSignature {
  _type = TypeSymbols.WarpSignature;

  constructor(
    public readonly signers: Bytes,
    public readonly signature: BlsSignature,
  ) {}

  static fromBytes(
    bytes: Uint8Array,
    codec: Codec,
  ): [WarpSignature, Uint8Array] {
    const [signers, signature, rest] = unpack(
      bytes,
      [Bytes, BlsSignature],
      codec,
    );

    return [new WarpSignature(signers, signature), rest];
  }

  toBytes(codec: Codec) {
    return pack([this.signers, this.signature], codec);
  }

  /**
   * Number of BLS public keys that participated in the
   * {@linkcode BlsSignature}. This is exposed because users of the signatures
   * typically impose a verification fee that is a function of the number of signers.
   *
   * This is used to calculate the Warp complexity in transactions.
   */
  numOfSigners(): number {
    return hammingWeight(this.signers.bytes);
  }
}
