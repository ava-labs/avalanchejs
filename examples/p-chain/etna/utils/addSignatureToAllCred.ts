import { secp256k1, type UnsignedTx } from '../../../../src';

export const addSigToAllCreds = async (
  unsignedTx: UnsignedTx,
  privateKey: Uint8Array,
) => {
  const unsignedBytes = unsignedTx.toBytes();
  const publicKey = secp256k1.getPublicKey(privateKey);

  if (!unsignedTx.hasPubkey(publicKey)) {
    return;
  }
  const signature = await secp256k1.sign(unsignedBytes, privateKey);

  for (let i = 0; i < unsignedTx.getCredentials().length; i++) {
    unsignedTx.addSignatureAt(signature, i, 0);
  }
};
