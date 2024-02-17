import type { UnsignedTx } from '../vms/common/unsignedTx';
import { getPublicKey, sign } from '../crypto/secp256k1';

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
      const publicKey = getPublicKey(privateKey);

      if (unsignedTx.hasPubkey(publicKey)) {
        const signature = await sign(unsignedBytes, privateKey);
        unsignedTx.addSignature(signature);
      }
    }),
  );
};
