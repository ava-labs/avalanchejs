import { publicKeyToEthAddress } from '../../utils';
import { UnsignedTx } from './unsignedTx';

export class EVMUnsignedTx extends UnsignedTx {
  protected publicKeyBytesToAddress(pubKey: Uint8Array): Uint8Array {
    return publicKeyToEthAddress(pubKey);
  }
  static fromJSON(jsonStr: string) {
    const tx = UnsignedTx.fromJSON(jsonStr);
    return new EVMUnsignedTx(tx.tx, tx.utxos, tx.addressMaps, tx.credentials);
  }
}
