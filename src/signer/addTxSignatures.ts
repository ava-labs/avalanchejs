import type { UnsignedTx } from '../vms/common/unsignedTx';
import { secp256k1 } from '../crypto';

export const addTxSignatures = async ({
  unsignedTx,
  privateKeys,
}: {
  unsignedTx: UnsignedTx;
  privateKeys: Uint8Array[];
}) => {
  const unsignedBytes = unsignedTx.toBytes();

  await Promise.all(
    privateKeys.map(async (privateKey) => {
      const publicKey = secp256k1.getPublicKey(privateKey);

      if (unsignedTx.hasPubkey(publicKey)) {
        const signature = await secp256k1.sign(unsignedBytes, privateKey);
        unsignedTx.addSignature(signature);
      }
    }),
  );
};
