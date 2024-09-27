import { TransferableOutput, addTxSignatures, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { getEtnaContextFromURI } from './utils/etna-context';

const AMOUNT_TO_EXPORT_AVAX: number = 0.001;

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY, X_CHAIN_ADDRESS } =
    getEnvVars();

  const context = await getEtnaContextFromURI(AVAX_PUBLIC_URL);

  const pvmApi = new pvm.PVMApi(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({
    addresses: [P_CHAIN_ADDRESS],
  });

  const exportTx = pvm.e.newExportTx(
    {
      destinationChainId: context.xBlockchainID,
      fromAddressesBytes: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      outputs: [
        TransferableOutput.fromNative(
          context.avaxAssetID,
          BigInt(AMOUNT_TO_EXPORT_AVAX * 1e9),
          [utils.bech32ToBytes(X_CHAIN_ADDRESS)],
        ),
      ],
      utxos,
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: exportTx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(exportTx.getSignedTx());
};

main().then(console.log);
