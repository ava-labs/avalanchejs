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
  const blsPublicKey = hexToBuffer(
    '0x8f95423f7142d00a48e1014a3de8d28907d420dc33b3052a6dee03a3f2941a393c2351e354704ca66a3fc29870282e15',
  );
  const blsSignature = hexToBuffer(
    '0x86a3ab4c45cfe31cae34c1d06f212434ac71b1be6cfe046c80c162e057614a94a5bc9f1ded1a7029deb0ba4ca7c9b71411e293438691be79c2dbf19d1ca7c3eadb9c756246fc5de5b7b89511c7d7302ae051d9e03d7991138299b5ed6a570a98',
  );

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
    undefined,
    1,
    0n,
    blsPublicKey,
    blsSignature,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return pvmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
