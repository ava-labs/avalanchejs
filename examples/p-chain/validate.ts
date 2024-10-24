import { PrimaryNetworkID } from '../../src/constants/networkIDs';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { PVMApi, newAddPermissionlessValidatorTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import { getEnvVars } from '../utils/getEnvVars';

const main = async () => {
  const {
    AVAX_PUBLIC_URL,
    P_CHAIN_ADDRESS,
    PRIVATE_KEY,
    BLS_PUBLIC_KEY,
    BLS_SIGNATURE,
    NODE_ID,
  } = getEnvVars();

  const { utxos } = await pvmapi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });
  const context = await getContextFromURI(AVAX_PUBLIC_URL);
  const startTime = await new PVMApi().getTimestamp();
  const startDate = new Date(startTime.timestamp);
  const start = BigInt(startDate.getTime() / 1000);
  const endTime = new Date(startTime.timestamp);
  endTime.setDate(endTime.getDate() + 21);
  const end = BigInt(endTime.getTime() / 1000);
  const nodeID = NODE_ID;
  const blsPublicKey = hexToBuffer(BLS_PUBLIC_KEY);
  const blsSignature = hexToBuffer(BLS_SIGNATURE);

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
