import { addTxSignatures, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';

const createSubnetTxExample = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const tx = pvm.e.newCreateSubnetTx(
    {
      feeState,
      fromAddressesBytes: [testPAddr],
      utxos,
      subnetOwners: [testPAddr],
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

createSubnetTxExample().then(console.log);
