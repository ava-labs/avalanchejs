import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newImportTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const P_CHAIN_ADDRESS = process.env.P_CHAIN_ADDRESS;
const X_CHAIN_ADDRESS = process.env.X_CHAIN_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const main = async () => {
  if (!P_CHAIN_ADDRESS || !X_CHAIN_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const context = await getContextFromURI(process.env.AVAX_PUBLIC_URL);

  const { utxos } = await pvmapi.getUTXOs({
    sourceChain: 'X',
    addresses: [P_CHAIN_ADDRESS],
  });

  const importTx = newImportTx(
    context,
    getChainIdFromContext('X', context),
    utxos,
    [bech32ToBytes(P_CHAIN_ADDRESS)],
    [bech32ToBytes(X_CHAIN_ADDRESS)],
  );

  await addTxSignatures({
    unsignedTx: importTx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return pvmapi.issueSignedTx(importTx.getSignedTx());
};

main().then(console.log);
