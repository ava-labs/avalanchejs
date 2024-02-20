import { serializable } from '../common/types';
import { bufferToHex, concatBytes } from '../../utils/buffer';
import { bls } from '../../crypto';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#proof-of-possession-specification-1
 */
@serializable()
export class ProofOfPossession {
  _type = TypeSymbols.ProofOfPossession;

  constructor(
    public readonly publicKey: Uint8Array,
    public readonly signature: Uint8Array,
  ) {
    const pk = bls.publicKeyFromBytes(publicKey);
    const sig = bls.signatureFromBytes(signature);

    pk.assertValidity();
    sig.assertValidity();

    if (!bls.verifyProofOfPossession(pk, sig, bls.publicKeyToBytes(pk))) {
      throw new Error(`Invalid proof of possession`);
    }
  }

  static fromBytes(bytes: Uint8Array): [ProofOfPossession, Uint8Array] {
    const pubkey = bytes.slice(0, bls.PUBLIC_KEY_LENGTH);
    const signature = bytes.slice(
      bls.PUBLIC_KEY_LENGTH,
      bls.PUBLIC_KEY_LENGTH + bls.SIGNATURE_LENGTH,
    );
    const rest = bytes.slice(bls.PUBLIC_KEY_LENGTH + bls.SIGNATURE_LENGTH);
    return [new ProofOfPossession(pubkey, signature), rest];
  }

  toString() {
    return bufferToHex(this.toBytes());
  }

  toBytes() {
    return concatBytes(this.publicKey, this.signature);
  }
}
