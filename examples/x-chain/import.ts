import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { newImportTx } from '../../src/vms/avm';
import { getContextFromURI } from '../../src/vms/context';
import { avmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';
import { getEnvVars } from '../utils/getEnvVars';

export const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY, X_CHAIN_ADDRESS } =
    getEnvVars();

  const context = await getContextFromURI(AVAX_PUBLIC_URL);

  const { utxos } = await avmapi.getUTXOs({
    sourceChain: 'P',
    addresses: [X_CHAIN_ADDRESS],
  });

  const tx = newImportTx(
    context,
    getChainIdFromContext('P', context),
    utxos,
    [bech32ToBytes(X_CHAIN_ADDRESS)],
    [bech32ToBytes(P_CHAIN_ADDRESS)],
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return avmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
