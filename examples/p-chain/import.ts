import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newImportTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import {
  pAddressForExamples,
  privateKeyForExamples,
  xAddressForExamples,
  cAddressBech32ForExamples,
} from '../example_accounts';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const main = async (sourceChain: 'C' | 'X', fromAddress: string) => {
  const pk = hexToBuffer(privateKeyForExamples);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([pk]);

  const { utxos } = await pvmapi.getUTXOs({
    sourceChain,
    addresses: [pAddressForExamples],
  });

  const importTx = newImportTx(
    context,
    getChainIdFromContext(sourceChain, context),
    utxos,
    [bech32ToBytes(pAddressForExamples)],
    [bech32ToBytes(fromAddress)],
  );
  await keyChain.addSignatures(importTx);
  printDeep(importTx.getSignedTx());
  return pvmapi.issueSignedTx(importTx.getSignedTx());
};

main('X', xAddressForExamples).then(console.log);
// main('C', cAddressBech32ForExamples).then(console.log);
