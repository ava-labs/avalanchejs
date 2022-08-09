import { publicKeyToEthAddress } from '../../utils';
import { UnsignedTx } from './unsignedTx';

export class EVMUnsignedTx extends UnsignedTx {
  publicKeyBytesToAddress(pubKey: Uint8Array): Uint8Array {
    return publicKeyToEthAddress(pubKey);
  }
}
