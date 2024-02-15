import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newImportTxFromBaseFee } from '../../src/vms/evm';
import { evmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const C_CHAIN_ADDRESS = process.env.C_CHAIN_ADDRESS;
const CORETH_ADDRESS = process.env.CORETH_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const main = async (sourceChain: 'X' | 'P') => {
  if (!C_CHAIN_ADDRESS || !CORETH_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const baseFee = await evmapi.getBaseFee();
  const context = await getContextFromURI(process.env.AVAX_PUBLIC_URL);

  const { utxos } = await evmapi.getUTXOs({
    sourceChain,
    addresses: [CORETH_ADDRESS],
  });

  const tx = newImportTxFromBaseFee(
    context,
    hexToBuffer(C_CHAIN_ADDRESS),
    [bech32ToBytes(CORETH_ADDRESS)],
    utxos,
    getChainIdFromContext(sourceChain, context),
    baseFee / BigInt(1e9),
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return evmapi.issueSignedTx(tx.getSignedTx());
};

main('X').then(console.log);
