import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { TransferableOutput } from '../../src/serializable/avax';
import { Address } from '../../src/serializable/fxs/common';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { PVMApi, PVMBuilder } from '../../src/vms/pvm';
import { pAddress, privateKey, xAddress } from '../example_accounts';

const main = async () => {
  const pvmapi = new PVMApi(AVAX_PUBLIC_URL_FUJI);
  const pk = hexToBuffer(privateKey);

  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([pk]);

  const { utxos } = await pvmapi.getUTXOs({
    addresses: [pAddress],
  });

  const builder = new PVMBuilder(context);
  const newExportTx = builder.newExportTx(
    context.xBlockchainID,
    [Address.fromString(pAddress).toBytes()],
    utxos,
    [
      TransferableOutput.fromNative(context.avaxAssetID, BigInt(1e8), [
        bech32ToBytes(xAddress),
      ]),
    ],
  );

  await keyChain.addSignatures(newExportTx);
  return pvmapi.issueSignedTx(newExportTx.getSignedTx());
};

main().then(console.log);
