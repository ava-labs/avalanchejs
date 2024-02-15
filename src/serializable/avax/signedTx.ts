import { concatBytes } from '@noble/hashes/utils';
import { DEFAULT_CODEC_VERSION } from '../../constants/codec';
import { getDefaultCodecFromTx } from '../../utils/packTx';
import { toListStruct } from '../../utils/serializeList';
import { unpack } from '../../utils/struct';
import type { Transaction } from '../../vms/common/transaction';
import { Codec } from '../codec/codec';
import type { Serializable } from '../common/types';
import { serializable } from '../common/types';
import type { Credential } from '../fxs/secp256k1';
import { Short } from '../primitives';
import { TypeSymbols } from '../constants';

/**
 * @see https://docs.avax.network/specs/avm-transaction-serialization#unsigned-Exporttx
 */
@serializable()
export class SignedTx {
  _type = TypeSymbols.AvmSignedTx;

  constructor(
    public readonly unsignedTx: Transaction,
    public readonly credentials: Serializable[],
  ) {}

  static fromBytes(bytes: Uint8Array, codec: Codec): [SignedTx, Uint8Array] {
    const [unsignedTx, outs, remaining] = unpack(
      bytes,
      [Codec, toListStruct(Codec)],
      codec,
    );
    return [new SignedTx(unsignedTx as Transaction, outs), remaining];
  }

  getCredentials(): Credential[] {
    return this.credentials as Credential[];
  }

  getAllSignatures() {
    return this.getCredentials().flatMap((cred) => cred.getSignatures());
  }

  toBytes() {
    const codec = getDefaultCodecFromTx(this.unsignedTx);
    return concatBytes(
      new Short(DEFAULT_CODEC_VERSION).toBytes(),
      codec.PackPrefix(this.unsignedTx),
      codec.PackPrefixList(this.credentials),
    );
  }
}
