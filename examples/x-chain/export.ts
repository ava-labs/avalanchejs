import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { TransferableOutput } from '../../src/serializable/avax';
import { Address } from '../../src/serializable/fxs/common';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { newExportTx } from '../../src/vms/avm';
import { getContextFromURI } from '../../src/vms/context';
import { avmapi } from '../chain_apis';
import {
  pAddressForExamples,
  privateKeyForExamples,
  xAddressForExamples,
  cAddressBech32ForExamples,
} from '../example_accounts';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const main = async (destinationChain: 'C' | 'P', toAddress: string) => {
  const pk = hexToBuffer(privateKeyForExamples);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([pk]);

  const { utxos } = await avmapi.getUTXOs({
    addresses: [xAddressForExamples],
  });

  const exportTx = newExportTx(
    context,
    getChainIdFromContext(destinationChain, context),
    [Address.fromString(xAddressForExamples).toBytes()],
    utxos,
    [
      TransferableOutput.fromNative(context.avaxAssetID, BigInt(0.1 * 1e9), [
        bech32ToBytes(toAddress),
      ]),
    ],
  );
  await keyChain.addSignatures(exportTx);
  printDeep(exportTx.getSignedTx());
  return avmapi.issueSignedTx(exportTx.getSignedTx());
};

// main('P', pAddressForExamples).then(console.log);
main('C', cAddressBech32ForExamples).then(console.log);
