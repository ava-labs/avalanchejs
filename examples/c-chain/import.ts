import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Address } from '../../src/serializable/fxs/common';
import { Secp256K1Keychain } from '../../src/signer/keychain';
import { hexToBuffer } from '../../src/utils';
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
    addresses: [cAddress],
  });

  const builder = new CorethBuilder(context);

  const newImportTx = builder.newImportTxFromBaseFee(
    hexToBuffer(cAddress),
    [Address.fromString(cAddressBech32).toBytes()],
    utxos,
    context.xBlockchainID,
    baseFee / BigInt(1e9),
  );

  const keyChain = new Secp256K1Keychain([pk]);
  await keyChain.addSignatures(newImportTx);

  const resp = await evmapi.issueSignedTx(newImportTx.getSignedTx());
  console.log('resp=', resp);
};

main();
