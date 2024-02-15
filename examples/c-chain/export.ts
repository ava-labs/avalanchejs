import { JsonRpcProvider } from 'ethers';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newExportTxFromBaseFee } from '../../src/vms/evm';
import { evmapi } from '../chain_apis';

const C_CHAIN_ADDRESS = process.env.C_CHAIN_ADDRESS;
const X_CHAIN_ADDRESS = process.env.X_CHAIN_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const main = async () => {
  if (!C_CHAIN_ADDRESS || !X_CHAIN_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const provider = new JsonRpcProvider(
    process.env.AVAX_PUBLIC_URL + '/ext/bc/C/rpc',
  );

  const context = await getContextFromURI(process.env.AVAX_PUBLIC_URL);
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
