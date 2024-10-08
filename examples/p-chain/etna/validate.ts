import { addTxSignatures, networkIDs, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { getEtnaContextFromURI } from './utils/etna-context';
import { getRandomNodeId } from './utils/random-node-id';

const AMOUNT_TO_VALIDATE_AVAX: number = 1;
const DAYS_TO_VALIDATE: number = 21;

const nodeId = getRandomNodeId();

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const context = await getEtnaContextFromURI(AVAX_PUBLIC_URL);

  const pvmApi = new pvm.PVMApi(AVAX_PUBLIC_URL);
  const feeState = await pvmApi.getFeeState();

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const startTime = await pvmApi.getTimestamp();
  const startDate = new Date(startTime.timestamp);
  const start: bigint = BigInt(startDate.getTime() / 1_000);

  const endTime = new Date(startTime.timestamp);
  endTime.setDate(endTime.getDate() + DAYS_TO_VALIDATE);
  const end: bigint = BigInt(endTime.getTime() / 1_000);

  const publicKey = utils.hexToBuffer(
    '0x8f95423f7142d00a48e1014a3de8d28907d420dc33b3052a6dee03a3f2941a393c2351e354704ca66a3fc29870282e15',
  );

  const signature = utils.hexToBuffer(
    '0x86a3ab4c45cfe31cae34c1d06f212434ac71b1be6cfe046c80c162e057614a94a5bc9f1ded1a7029deb0ba4ca7c9b71411e293438691be79c2dbf19d1ca7c3eadb9c756246fc5de5b7b89511c7d7302ae051d9e03d7991138299b5ed6a570a98',
  );

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
