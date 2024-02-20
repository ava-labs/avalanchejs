import { secp256k1 } from '../../crypto';
import { UnsignedTx } from './unsignedTx';
import { Address } from '../../serializable/fxs/common';

export class EVMUnsignedTx extends UnsignedTx {
  hasPubkey(pubKey: Uint8Array): boolean {
    const addrAvax = new Address(this.publicKeyBytesToAddress(pubKey));
    const addrEVM = new Address(secp256k1.publicKeyToEthAddress(pubKey));

    return this.hasAddress(addrAvax) || this.hasAddress(addrEVM);
  }

  static fromJSON(jsonStr: string) {
    const tx = UnsignedTx.fromJSON(jsonStr);
    return new EVMUnsignedTx(tx.tx, tx.utxos, tx.addressMaps, tx.credentials);
  }
}
