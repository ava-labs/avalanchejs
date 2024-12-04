import { pvm, utils } from '../../../src';
import { setupEtnaExample } from './utils/etna-helper';
import { testGenesisData } from '../../../src/fixtures/transactions';
import { getEnvVars } from '../../utils/getEnvVars';
import { addSigToAllCreds } from './utils/addSignatureToAllCred';

/**
 * Create a new chain on the P-Chain.
 *
 * **Note** A subnet must be created (createSubnetTx) before a chain can be created.
 * @param vmId the platform chain's vmID can be found in the `InfoApi.getVMs` response.
 * @param subnetId the ID of the subnet that is created via `createSubnetTx`.
 * @param chainName the name of the chain.  Can be any string.
 * @returns The resulting transaction's ID.
 */
const createChainTxExample = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();
  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const vmId = 'rWhpuQPF1kb72esV2momhMuTYGkEb1oL29pt2EBXWmSy4kxnT'; // platform vmId
  const subnetId = ''; // subnetId from createSubnetTx

  const tx = pvm.e.newCreateChainTx(
    {
      feeState,
      fromAddressesBytes: [testPAddr],
      utxos,
      chainName: 'test chain',
      subnetAuth: [0],
      subnetId,
      vmId,
      fxIds: [],
      genesisData: testGenesisData,
    },
    context,
  );

  await addSigToAllCreds(tx, utils.hexToBuffer(PRIVATE_KEY));

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

createChainTxExample().then(console.log);
