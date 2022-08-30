import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { TransferableOutput } from '../../src/serializable/avax';
import { Address } from '../../src/serializable/fxs/common';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { newExportTx } from '../../src/vms/avm';
import { getContextFromURI } from '../../src/vms/context';
import { PVMApi } from '../../src/vms/pvm';
import {
  pAddressForExamples,
  privateKeyForExamples,
  xAddressForExamples,
} from '../example_accounts';

const main = async () => {
  const pvmapi = new PVMApi(AVAX_PUBLIC_URL_FUJI);
  const pk = hexToBuffer(privateKeyForExamples);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([pk]);

  const { utxos } = await pvmapi.getUTXOs({
    addresses: [pAddressForExamples],
  });

  const exportTx = newExportTx(
    context,
    context.xBlockchainID,
    [Address.fromString(pAddressForExamples).toBytes()],
    utxos,
    [
      TransferableOutput.fromNative(context.avaxAssetID, BigInt(1e8), [
        bech32ToBytes(xAddressForExamples),
      ]),
    ],
  );

  await keyChain.addSignatures(exportTx);
  return pvmapi.issueSignedTx(exportTx.getSignedTx());
};

main().then(console.log);
