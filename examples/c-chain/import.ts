import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer/keychain';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newImportTxFromBaseFee } from '../../src/vms/evm';
import {
  cAddressBech32ForExamples,
  cAddressForExamples,
  privateKeyForExamples,
} from '../example_accounts';
import { evmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const main = async (sourceChain: 'X' | 'P') => {
  const baseFee = await evmapi.getBaseFee();
  const pk = hexToBuffer(privateKeyForExamples);
  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);

  const { utxos } = await evmapi.getUTXOs({
    sourceChain,
    addresses: [cAddressBech32ForExamples],
  });

  const newImportTx = newImportTxFromBaseFee(
    context,
    hexToBuffer(cAddressForExamples),
    [bech32ToBytes(cAddressBech32ForExamples)],
    utxos,
    getChainIdFromContext(sourceChain, context),
    baseFee / BigInt(1e9),
  );
  const keyChain = new Secp256K1Keychain([pk]);

  await keyChain.addSignatures(newImportTx);
  printDeep(newImportTx.getSignedTx());
  return evmapi.issueSignedTx(newImportTx.getSignedTx());
};

main('X').then(console.log);
