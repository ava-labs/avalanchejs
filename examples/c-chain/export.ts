import { ethers } from 'ethers';
import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { EVMApi, newExportTxFromBaseFee } from '../../src/vms/evm';
import {
  cAddressForExamples,
  privateKeyForExamples,
  xAddressForExamples,
} from '../example_accounts';

const main = async () => {
  const evmapi = new EVMApi(AVAX_PUBLIC_URL_FUJI);
  const provider = new ethers.providers.JsonRpcProvider(
    AVAX_PUBLIC_URL_FUJI + '/ext/bc/C/rpc',
  );

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([hexToBuffer(privateKeyForExamples)]);
  const txCount = await provider.getTransactionCount(cAddressForExamples);
  const xAddressBytes = bech32ToBytes(xAddressForExamples);

  const baseFee = await evmapi.getBaseFee();
  const tx = newExportTxFromBaseFee(
    context,
    baseFee / BigInt(1e9),
    BigInt(0.5 * 1e9),
    context.xBlockchainID,
    hexToBuffer(cAddressForExamples),
    [xAddressBytes],
    BigInt(txCount),
  );

  await keyChain.addSignatures(tx);
  return evmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
