import { ethers } from 'ethers';
import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { CorethBuilder, EVMApi } from '../../src/vms/evm';
import { cAddress, privateKey, xAddress } from '../example_accounts';

const main = async () => {
  const evmapi = new EVMApi(AVAX_PUBLIC_URL_FUJI);
  const provider = new ethers.providers.JsonRpcProvider(
    AVAX_PUBLIC_URL_FUJI + '/ext/bc/C/rpc',
  );

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([hexToBuffer(privateKey)]);
  const txCount = await provider.getTransactionCount(cAddress);
  const xAddressBytes = bech32ToBytes(xAddress);

  const baseFee = await evmapi.getBaseFee();
  const builder = new CorethBuilder(context);
  const tx = builder.newExportTxFromBaseFee(
    baseFee / BigInt(1e9),
    BigInt(0.5 * 1e9),
    context.xBlockchainID,
    hexToBuffer(cAddress),
    [xAddressBytes],
    BigInt(txCount),
  );

  await keyChain.addSignatures(tx);
  return evmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
