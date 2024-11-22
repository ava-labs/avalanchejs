import type { Signature } from '../../../crypto/bls';
import {
  SIGNATURE_LENGTH,
  signatureFromBytes,
  signatureToBytes,
} from '../../../crypto/bls';
import { hexToBuffer } from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { TypeSymbols } from '../../constants';
import { Primitives } from '../../primitives/primatives';

@serializable()
export class BlsSignature extends Primitives {
  _type = TypeSymbols.BlsSignature;

  constructor(public readonly signature: Signature) {
    super();
  }

  static fromSignatureBytes(signatureBytes: Uint8Array): BlsSignature {
    return new BlsSignature(signatureFromBytes(signatureBytes));
  }

  static fromBytes(
    bytes: Uint8Array,
  ): [blsSignature: BlsSignature, rest: Uint8Array] {
    const blsSignatureBytes = bytes.slice(0, SIGNATURE_LENGTH);
    const signature = signatureFromBytes(blsSignatureBytes);
    const rest = bytes.slice(SIGNATURE_LENGTH);

    return [new BlsSignature(signature), rest];
  }

  static fromHex(hex: string): BlsSignature {
    return new BlsSignature(signatureFromBytes(hexToBuffer(hex)));
  }

  toBytes() {
    return signatureToBytes(this.signature);
  }

  toString() {
    return this.signature.toHex();
  }

  toJSON() {
    return this.toString();
  }
}
