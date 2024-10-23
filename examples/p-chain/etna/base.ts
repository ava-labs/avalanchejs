import { TransferableOutput, addTxSignatures, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';

/**
 * The amount of AVAX to send to self.
 */
const SEND_AVAX_AMOUNT: number = 0.9;

const P_CHAIN_ADDRESS = 'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs';
const DEST_P_CHAIN_ADDRESS = 'P-custom1s4k9fch6uyhvv7necq070nzljgrqvazkpgles6';

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const PRIVATE_KEY =
  '0x434ff9ff91a000671dd4c9b9021192f795658a013e3793ee2cd504537a78be6e';

const main = async () => {
  // const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const tx = pvm.e.newBaseTx(
    {
      feeState,
      fromAddressesBytes: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      outputs: [
        TransferableOutput.fromNative(
          context.avaxAssetID,
          BigInt(SEND_AVAX_AMOUNT * 1e9),
          [utils.bech32ToBytes(DEST_P_CHAIN_ADDRESS)],
        ),
      ],
      utxos,
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
