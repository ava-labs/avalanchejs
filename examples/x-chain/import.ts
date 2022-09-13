import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { AVMApi, newImportTx } from '../../src/vms/avm';
import { getContextFromURI } from '../../src/vms/context';
import {
  pAddressForExamples,
  privateKeyForExamples,
  xAddressForExamples,
} from '../example_accounts';

export const main = async () => {
  const avmapi = new AVMApi(AVAX_PUBLIC_URL_FUJI);
  const pk = hexToBuffer(privateKeyForExamples);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([pk]);

  const { utxos } = await avmapi.getUTXOs({
    sourceChain: 'P',
    addresses: [xAddressForExamples],
  });

  const newExportTx = newImportTx(
    context,
    context.pBlockchainID,
    utxos,
    [bech32ToBytes(xAddressForExamples)],
    [bech32ToBytes(pAddressForExamples)],
  );
  await keyChain.addSignatures(newExportTx);
  printDeep(newExportTx.getSignedTx());
  return avmapi.issueSignedTx(newExportTx.getSignedTx());
};

main().then(console.log);
