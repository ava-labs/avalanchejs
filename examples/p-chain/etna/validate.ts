import { addTxSignatures, networkIDs, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';
import { getRandomNodeId } from './utils/random-node-id';

const AMOUNT_TO_VALIDATE_AVAX: number = 1;
const DAYS_TO_VALIDATE: number = 21;

const nodeId = getRandomNodeId();

const main = async () => {
  const {
    AVAX_PUBLIC_URL,
    P_CHAIN_ADDRESS,
    PRIVATE_KEY,
    BLS_PUBLIC_KEY,
    BLS_SIGNATURE,
  } = getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const startTime = await pvmApi.getTimestamp();
  const startDate = new Date(startTime.timestamp);
  const start: bigint = BigInt(startDate.getTime() / 1_000);

  const endTime = new Date(startTime.timestamp);
  endTime.setDate(endTime.getDate() + DAYS_TO_VALIDATE);
  const end: bigint = BigInt(endTime.getTime() / 1_000);

  const publicKey = utils.hexToBuffer(BLS_PUBLIC_KEY);

  const signature = utils.hexToBuffer(BLS_SIGNATURE);

  const tx = pvm.e.newAddPermissionlessValidatorTx(
    {
      end,
      delegatorRewardsOwner: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      feeState,
      fromAddressesBytes: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      nodeId,
      publicKey,
      rewardAddresses: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      shares: 20 * 1e4,
      signature,
      start,
      subnetId: networkIDs.PrimaryNetworkID.toString(),
      utxos,
      weight: BigInt(AMOUNT_TO_VALIDATE_AVAX * 1e9),
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

main()
  .then(console.log)
  .then(() => console.log('Validate node ID:', nodeId));
