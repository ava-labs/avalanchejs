import { JsonRpcProvider } from 'ethers';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newExportTxFromBaseFee } from '../../src/vms/evm';
import { evmapi } from '../chain_apis';

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const P_CHAIN_ADDRESS = 'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs';
const PRIVATE_KEY =
  '0x434ff9ff91a000671dd4c9b9021192f795658a013e3793ee2cd504537a78be6e'; //'0x434ff9ff91a000671dd4c9b9021192f795658a013e3793ee2cd504537a78be6e';
const C_CHAIN_ADDRESS = '0xa65Edcc54181CF263A4DbB9AEcB5cF1b444ABF0a'; //'0xa65Edcc54181CF263A4DbB9AEcB5cF1b444ABF0a';

const main = async () => {
  if (!C_CHAIN_ADDRESS || !P_CHAIN_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const provider = new JsonRpcProvider(AVAX_PUBLIC_URL + '/ext/bc/C/rpc');

  const context = await getContextFromURI(AVAX_PUBLIC_URL);
  const txCount = await provider.getTransactionCount(C_CHAIN_ADDRESS);
  const baseFee = await evmapi.getBaseFee();
  const xAddressBytes = bech32ToBytes(P_CHAIN_ADDRESS);

  const tx = newExportTxFromBaseFee(
    context,
    baseFee / BigInt(1e9),
    BigInt(0.9 * 1e9),
    context.pBlockchainID,
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
