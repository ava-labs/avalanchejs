import { addTxSignatures, networkIDs, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { getEtnaContextFromURI } from './utils/etna-context';

const AMOUNT_TO_DELEGATE_AVAX: number = 1;
const DAYS_TO_DELEGATE: number = 21;

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const pvmApi = new pvm.PVMApi(AVAX_PUBLIC_URL);

  const context = await getEtnaContextFromURI(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const startTime = await pvmApi.getTimestamp();
  const startDate = new Date(startTime.timestamp);
  const start: bigint = BigInt(startDate.getTime() / 1_000);

  const endTime = new Date(startTime.timestamp);
  endTime.setDate(endTime.getDate() + DAYS_TO_DELEGATE);
  const end: bigint = BigInt(endTime.getTime() / 1_000);

  const nodeId = 'NodeID-HKLp5269LH8DcrLvHPc2PHjGczBQD3td4';

  const tx = pvm.e.newAddPermissionlessDelegatorTx(
    {
      end,
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
