import { JsonRpcProvider } from 'ethers';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newExportTxFromBaseFee } from '../../src/vms/evm';
import { evmapi } from '../chain_apis';
import { getEnvVars } from '../utils/getEnvVars';

const main = async () => {
  const { AVAX_PUBLIC_URL, C_CHAIN_ADDRESS, PRIVATE_KEY, X_CHAIN_ADDRESS } =
    getEnvVars();

  const provider = new JsonRpcProvider(AVAX_PUBLIC_URL + '/ext/bc/C/rpc');

  const context = await getContextFromURI(AVAX_PUBLIC_URL);
  const txCount = await provider.getTransactionCount(C_CHAIN_ADDRESS);
  const baseFee = await evmapi.getBaseFee();
  const xAddressBytes = bech32ToBytes(X_CHAIN_ADDRESS);

  const tx = newExportTxFromBaseFee(
    context,
    baseFee / BigInt(1e9),
    BigInt(0.1 * 1e9),
    context.xBlockchainID,
    hexToBuffer(C_CHAIN_ADDRESS),
    [xAddressBytes],
    BigInt(txCount),
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return evmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
