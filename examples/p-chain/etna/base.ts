import { TransferableOutput, addTxSignatures, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { getEtnaContextFromURI } from './utils/etna-context';

/**
 * The amount of AVAX to send to self.
 */
const SEND_AVAX_AMOUNT: number = 0.001;

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const context = await getEtnaContextFromURI(AVAX_PUBLIC_URL);

  const pvmApi = new pvm.PVMApi(AVAX_PUBLIC_URL);
  const feeState = await pvmApi.getFeeState();

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const tx = pvm.e.newBaseTx(
    {
      feeState,
      fromAddressesBytes: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      outputs: [
        TransferableOutput.fromNative(
          context.avaxAssetID,
          BigInt(SEND_AVAX_AMOUNT * 1e9),
          [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
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
