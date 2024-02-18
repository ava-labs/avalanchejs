import { secp256k1 } from '../crypto';
import { hexToBuffer } from '../utils';

export const testPrivateKey1 = hexToBuffer(
  '9c0523e7611e62f5dca291ad335e950db076c5ee31c4107355abde0d357bbd29',
);
export const testPublicKey1 = secp256k1.getPublicKey(testPrivateKey1);
export const testAddress1 = secp256k1.publicKeyBytesToAddress(testPublicKey1);
export const testEthAddress1 = secp256k1.publicKeyToEthAddress(testPublicKey1);

export const testPrivateKey2 = hexToBuffer(
  'd11e7aa633eb15682bc2456d399c2a9861c82e0a308dbfd4d3a51ffa972f2b62',
);
export const testPublicKey2 = secp256k1.getPublicKey(testPrivateKey2);
export const testAddress2 = secp256k1.publicKeyBytesToAddress(testPublicKey2);
export const testEthAddress2 = secp256k1.publicKeyToEthAddress(testPublicKey2);
