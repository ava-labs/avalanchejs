import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { newImportTx } from '../../src/vms/avm';
import { getContextFromURI } from '../../src/vms/context';
import { avmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const P_CHAIN_ADDRESS = process.env.P_CHAIN_ADDRESS;
const X_CHAIN_ADDRESS = process.env.X_CHAIN_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

export const main = async () => {
  if (!P_CHAIN_ADDRESS || !X_CHAIN_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const context = await getContextFromURI(process.env.AVAX_PUBLIC_URL);

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
