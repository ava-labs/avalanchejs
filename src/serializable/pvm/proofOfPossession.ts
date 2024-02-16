import { serializable } from '../common/types';
import { bufferToHex, concatBytes } from '../../utils/buffer';
import * as bls from '../../utils/bls';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/platform-transaction-serialization#proof-of-possession-specification-1
 */
@serializable()
export class ProofOfPossession {
  _type = TypeSymbols.ProofOfPossession;

  constructor(
    public readonly publicKey: bls.PublicKey,
    public readonly signature: bls.Signature,
  ) {
    publicKey.assertValidity();
    signature.assertValidity();

    if (
      !bls.VerifyProofOfPossession(
        publicKey,
        signature,
        bls.PublicKeyToBytes(publicKey),
      )
    ) {
      throw new Error(`Invalid signature`);
    }
  }

  static fromBytes(bytes: Uint8Array): [ProofOfPossession, Uint8Array] {
    const pubkey = bls.PublicKeyFromBytes(
      bytes.slice(0, bls.PUBLIC_KEY_LENGTH),
    );
    const signature = bls.SignatureFromBytes(
      bytes.slice(
        bls.PUBLIC_KEY_LENGTH,
        bls.PUBLIC_KEY_LENGTH + bls.SIGNATURE_LENGTH,
      ),
    );
    const rest = bytes.slice(bls.PUBLIC_KEY_LENGTH + bls.SIGNATURE_LENGTH);
    return [new ProofOfPossession(pubkey, signature), rest];
  }

  toString() {
    return bufferToHex(this.toBytes());
  }

  toBytes() {
    return concatBytes(
      bls.PublicKeyToBytes(this.publicKey),
      bls.SignatureToBytes(this.signature),
    );
  }
}
