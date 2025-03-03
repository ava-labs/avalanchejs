import type { PublicKey } from '../../../crypto/bls';
import {
  PUBLIC_KEY_LENGTH,
  publicKeyFromBytes,
  publicKeyToBytes,
} from '../../../crypto/bls';
import { hexToBuffer } from '../../../utils/buffer';
import { serializable } from '../../common/types';
import { TypeSymbols } from '../../constants';
import { Primitives } from '../../primitives/primatives';

@serializable()
export class BlsPublicKey extends Primitives {
  _type = TypeSymbols.BlsPublicKey;

  constructor(public readonly publicKey: PublicKey) {
    super();
  }

  static fromPublicKeyBytes(publicKeyBytes: Uint8Array): BlsPublicKey {
    return new BlsPublicKey(publicKeyFromBytes(publicKeyBytes));
  }

  static fromBytes(
    bytes: Uint8Array,
  ): [blsPublicKey: BlsPublicKey, rest: Uint8Array] {
    const blsPublicKeyBytes = bytes.slice(0, PUBLIC_KEY_LENGTH);
    const publicKey = publicKeyFromBytes(blsPublicKeyBytes);
    const rest = bytes.slice(PUBLIC_KEY_LENGTH);

    return [new BlsPublicKey(publicKey), rest];
  }

  static fromHex(hex: string): BlsPublicKey {
    return new BlsPublicKey(publicKeyFromBytes(hexToBuffer(hex)));
  }

  toBytes() {
    return publicKeyToBytes(this.publicKey);
  }

  toString() {
    return this.publicKey.toHex();
  }

  toJSON() {
    return this.toString();
  }
}
