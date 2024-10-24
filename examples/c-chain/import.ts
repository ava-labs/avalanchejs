import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newImportTxFromBaseFee } from '../../src/vms/evm';
import { evmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';
import { getEnvVars } from '../utils/getEnvVars';

const main = async (sourceChain: 'X' | 'P') => {
  const { AVAX_PUBLIC_URL, C_CHAIN_ADDRESS, PRIVATE_KEY, CORETH_ADDRESS } =
    getEnvVars();

  const baseFee = await evmapi.getBaseFee();
  const context = await getContextFromURI(AVAX_PUBLIC_URL);

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
