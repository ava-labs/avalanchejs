import { secp256k1 } from '../../crypto';
import { UnsignedTx } from './unsignedTx';
import { Address } from '../../serializable/fxs/common';

export class EVMUnsignedTx extends UnsignedTx {
  protected getAddressHexesForPubKey(pubKey: Uint8Array): string[] {
    return [
      new Address(this.publicKeyBytesToAddress(pubKey)).toHex(),
      new Address(secp256k1.publicKeyToEthAddress(pubKey)).toHex(),
    ];
  }

  static fromJSON(jsonStr: string) {
    const tx = UnsignedTx.fromJSON(jsonStr);
    return new EVMUnsignedTx(tx.tx, tx.utxos, tx.addressMaps, tx.credentials);
  }
}
