import { PrimaryNetworkID } from '../../src/constants/networkIDs';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { PVMApi, newAddPermissionlessDelegatorTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import { getEnvVars } from '../utils/getEnvVars';

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const { utxos } = await pvmapi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });
  const context = await getContextFromURI(AVAX_PUBLIC_URL);
  const startTime = await new PVMApi().getTimestamp();
  const startDate = new Date(startTime.timestamp);
  const start = BigInt(startDate.getTime() / 1000);
  const endTime = new Date(startTime.timestamp);
  endTime.setDate(endTime.getDate() + 21);
  const end = BigInt(endTime.getTime() / 1000);
  const nodeID = 'NodeID-HKLp5269LH8DcrLvHPc2PHjGczBQD3td4';

  const tx = newAddPermissionlessDelegatorTx(
    context,
    utxos,
    [bech32ToBytes(P_CHAIN_ADDRESS)],
    nodeID,
    PrimaryNetworkID.toString(),
    start,
    end,
    BigInt(1e9),
    [bech32ToBytes(P_CHAIN_ADDRESS)],
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return pvmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
