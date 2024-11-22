import { TransferableOutput } from '../../src/serializable/avax';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newExportTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';
import { getEnvVars } from '../utils/getEnvVars';

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY, X_CHAIN_ADDRESS } =
    getEnvVars();

  const context = await getContextFromURI(AVAX_PUBLIC_URL);

  const { utxos } = await pvmapi.getUTXOs({
    addresses: [P_CHAIN_ADDRESS],
  });

  const tx = newExportTx(
    context,
    getChainIdFromContext('X', context),
    [bech32ToBytes(P_CHAIN_ADDRESS)],
    utxos,
    [
      TransferableOutput.fromNative(context.avaxAssetID, BigInt(0.1 * 1e9), [
        bech32ToBytes(X_CHAIN_ADDRESS),
      ]),
    ],
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return pvmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
