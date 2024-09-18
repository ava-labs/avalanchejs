import { JsonRpcProvider } from 'ethers';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newExportTxFromBaseFee } from '../../src/vms/evm';
import { evmapi } from '../chain_apis';

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const C_CHAIN_ADDRESS = process.env.C_CHAIN_ADDRESS;
const P_CHAIN_ADDRESS = process.env.P_CHAIN_ADDRESS;

const main = async () => {
  console.log({ url: process.env.AVAX_PUBLIC_URL });
  if (!C_CHAIN_ADDRESS || !P_CHAIN_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const provider = new JsonRpcProvider(
    process.env.AVAX_PUBLIC_URL + '/ext/bc/C/rpc',
  );

  const context = await getContextFromURI(process.env.AVAX_PUBLIC_URL);
  console.log({ context });
  const txCount = await provider.getTransactionCount(C_CHAIN_ADDRESS);
  const baseFee = await evmapi.getBaseFee();
  const pAddressBytes = bech32ToBytes(P_CHAIN_ADDRESS);

  const tx = newExportTxFromBaseFee(
    context,
    baseFee / BigInt(1e9),
    BigInt(0.1 * 1e9),
    context.pBlockchainID,
    hexToBuffer(C_CHAIN_ADDRESS),
    [pAddressBytes],
    BigInt(txCount),
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return evmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
