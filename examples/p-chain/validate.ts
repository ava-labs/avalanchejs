import { PrimaryNetworkID } from '../../src/constants/networkIDs';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { PVMApi, newAddPermissionlessValidatorTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';

const P_CHAIN_ADDRESS = process.env.P_CHAIN_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const main = async () => {
  if (!P_CHAIN_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const { utxos } = await pvmapi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });
  const context = await getContextFromURI(process.env.AVAX_PUBLIC_URL);
  const startTime = await new PVMApi().getTimestamp();
  const startDate = new Date(startTime.timestamp);
  const start = BigInt(startDate.getTime() / 1000);
  const endTime = new Date(startTime.timestamp);
  endTime.setDate(endTime.getDate() + 21);
  const end = BigInt(endTime.getTime() / 1000);
  const nodeID = 'NodeID-HKLp5269LH8DcrLvNDoJquQs2w1LwLCga';

  const tx = newAddPermissionlessValidatorTx(
    context,
    utxos,
    [bech32ToBytes(P_CHAIN_ADDRESS)],
    nodeID,
    PrimaryNetworkID.toString(),
    start,
    end,
    BigInt(1e9),
    [bech32ToBytes(P_CHAIN_ADDRESS)],
    [bech32ToBytes(P_CHAIN_ADDRESS)],
    1e4 * 20,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return pvmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
