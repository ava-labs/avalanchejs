import { addTxSignatures, networkIDs, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';

const AMOUNT_TO_DELEGATE_AVAX: number = 1;
const DAYS_TO_DELEGATE: number = 14;

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const startTime = await pvmApi.getTimestamp();
  const startDate = new Date(startTime.timestamp);
  const start: bigint = BigInt(startDate.getTime() / 1_000);

  const endTime = new Date(startTime.timestamp);
  endTime.setDate(endTime.getDate() + DAYS_TO_DELEGATE);
  const end: bigint = BigInt(endTime.getTime() / 1_000);

  // TODO: Get this from an argument.
  const nodeId = 'NodeID-MqgFXT8JhorbEW2LpTDGePBBhv55SSp3M';

  const tx = pvm.e.newAddPermissionlessDelegatorTx(
    {
      end,
      feeState,
      fromAddressesBytes: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      nodeId,
      rewardAddresses: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      start,
      subnetId: networkIDs.PrimaryNetworkID.toString(),
      utxos,
      weight: BigInt(AMOUNT_TO_DELEGATE_AVAX * 1e9),
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
