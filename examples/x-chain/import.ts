import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { newImportTx } from '../../src/vms/avm';
import { getContextFromURI } from '../../src/vms/context';
import { avmapi } from '../chain_apis';
import {
  pAddressForExamples,
  privateKeyForExamples,
  xAddressForExamples,
  cAddressBech32ForExamples,
} from '../example_accounts';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

export const main = async (sourceChain: 'C' | 'P', fromAddress: string) => {
  const pk = hexToBuffer(privateKeyForExamples);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([pk]);

  const { utxos } = await avmapi.getUTXOs({
    sourceChain,
    addresses: [xAddressForExamples],
  });

  const newImTx = newImportTx(
    context,
    getChainIdFromContext(sourceChain, context),
    utxos,
    [bech32ToBytes(xAddressForExamples)],
    [bech32ToBytes(fromAddress)],
  );
  await keyChain.addSignatures(newImTx);
  printDeep(newImTx.getSignedTx());
  return avmapi.issueSignedTx(newImTx.getSignedTx());
};

/** Youre either importing from the P chain or the c chain, uncomment the one that is relevant */
main('C', cAddressBech32ForExamples).then(console.log);
// main('P', pAddressForExamples).then(console.log);
