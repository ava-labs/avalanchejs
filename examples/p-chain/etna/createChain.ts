import { addTxSignatures, pvm, utils } from '../../../src';
import { setupEtnaExample } from './utils/etna-helper';
import { testGenesisData } from '../../../src/fixtures/transactions';
import { getEnvVars } from '../../utils/getEnvVars';

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();
  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const tx = pvm.e.newCreateChainTx(
    {
      feeState,
      fromAddressesBytes: [testPAddr],
      utxos,
      chainName: 'test chain',
      subnetAuth: [0],
      subnetId: '', // subnetId from createSubnetTx
      vmId: 'rWhpuQPF1kb72esV2momhMuTYGkEb1oL29pt2EBXWmSy4kxnT', // platform vmId
      fxIds: [],
      genesisData: testGenesisData,
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
