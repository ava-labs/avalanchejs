import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer/keychain';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { CorethBuilder, EVMApi } from '../../src/vms/evm';
import { cAddress, cAddressBech32, privateKey } from '../example_accounts';

const main = async () => {
  const evmapi = new EVMApi(AVAX_PUBLIC_URL_FUJI);
  const baseFee = await evmapi.getBaseFee();
  const pk = hexToBuffer(privateKey);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);

  const { utxos } = await evmapi.getUTXOs({
    sourceChain: 'X',
    addresses: [cAddressBech32],
  });

  const builder = new CorethBuilder(context);

  const newImportTx = builder.newImportTxFromBaseFee(
    hexToBuffer(cAddress),
    [bech32ToBytes(cAddressBech32)],
    utxos,
    context.xBlockchainID,
    baseFee / BigInt(1e9),
  );

  const keyChain = new Secp256K1Keychain([pk]);
  await keyChain.addSignatures(newImportTx);

  return evmapi.issueSignedTx(newImportTx.getSignedTx());
};

main().then(console.log);
