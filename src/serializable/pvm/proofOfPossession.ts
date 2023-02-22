import { serializable } from '../common/types';
import { concatBytes } from '../../utils/buffer';
import { BLS_PUBKEY_LENGTH, BLS_SIGNATURE_LENGTH } from '../../constants/bls';

export const proofOfPossession_symbol = Symbol('pvm.proofOfPossession');

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#proof-of-possession-specification-1
 */
@serializable()
export class ProofOfPossession {
  _type = proofOfPossession_symbol;

  constructor(
    public readonly publicKey: Uint8Array,
    public readonly signature: Uint8Array,
  ) {
    if (publicKey.length !== BLS_PUBKEY_LENGTH)
      throw new Error(`public key must be ${BLS_PUBKEY_LENGTH} bytes`);
    if (signature.length !== BLS_SIGNATURE_LENGTH)
      throw new Error(`signature must be ${BLS_SIGNATURE_LENGTH} bytes`);
  }

  static fromBytes(bytes: Uint8Array): [ProofOfPossession, Uint8Array] {
    const pubkey = bytes.slice(0, BLS_PUBKEY_LENGTH);
    const signature = bytes.slice(
      BLS_PUBKEY_LENGTH,
      BLS_PUBKEY_LENGTH + BLS_SIGNATURE_LENGTH,
    );
    const rest = bytes.slice(BLS_PUBKEY_LENGTH + BLS_SIGNATURE_LENGTH);
    return [new ProofOfPossession(pubkey, signature), rest];
  }

  toBytes() {
    return concatBytes(this.publicKey, this.signature);
  }
}
