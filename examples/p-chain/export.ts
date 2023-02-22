import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { TransferableOutput } from '../../src/serializable/avax';
import { Address } from '../../src/serializable/fxs/common';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newExportTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import {
  pAddressForExamples,
  privateKeyForExamples,
  xAddressForExamples,
  cAddressBech32ForExamples,
} from '../example_accounts';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const main = async (destinationChain: 'C' | 'X', toAddress: string) => {
  const pk = hexToBuffer(privateKeyForExamples);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([pk]);

  const { utxos } = await pvmapi.getUTXOs({
    addresses: [pAddressForExamples],
  });

  const exportTx = newExportTx(
    context,
    getChainIdFromContext(destinationChain, context),
    [Address.fromString(pAddressForExamples).toBytes()],
    utxos,
    [
      TransferableOutput.fromNative(context.avaxAssetID, BigInt(0.01 * 1e9), [
        bech32ToBytes(toAddress),
      ]),
    ],
  );
  await keyChain.addSignatures(exportTx);
  printDeep(exportTx.getSignedTx());
  return pvmapi.issueSignedTx(exportTx.getSignedTx());
};

main('X', xAddressForExamples).then(console.log);
// main('C', cAddressBech32ForExamples).then(console.log);
