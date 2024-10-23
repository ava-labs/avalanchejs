import { TransferableOutput, addTxSignatures, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';

const AMOUNT_TO_EXPORT_AVAX: number = 0.9;

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const P_CHAIN_ADDRESS = 'P-custom1s4k9fch6uyhvv7necq070nzljgrqvazkpgles6';
const PRIVATE_KEY =
  '0x434ff9ff91a000671dd4c9b9021192f795658a013e3793ee2cd504537a78be6e';
const C_CHAIN_ADDRESS = 'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs';

const main = async () => {
  // const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({
    addresses: [C_CHAIN_ADDRESS],
  });

  const exportTx = pvm.e.newExportTx(
    {
      destinationChainId: context.pBlockchainID,
      feeState,
      fromAddressesBytes: [utils.bech32ToBytes(C_CHAIN_ADDRESS)],
      outputs: [
        TransferableOutput.fromNative(
          context.avaxAssetID,
          BigInt(AMOUNT_TO_EXPORT_AVAX * 1e9),
          [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
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
