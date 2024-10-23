import { addTxSignatures, Id, networkIDs, pvm, utils } from '../../../src';
import { setupEtnaExample } from './utils/etna-helper';
import { testGenesisData } from '../../../src/fixtures/transactions';

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const P_CHAIN_ADDRESS = 'P-custom1s4k9fch6uyhvv7necq070nzljgrqvazkpgles6';
const PRIVATE_KEY =
  '0x025a930379c7a4d9258c8a39104d50389c9a59db290b3db93b3f66b85dcc2bd2';

const main = async () => {
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
      subnetId: 'Us4d9tR3JD6q8wbPAjzUMkCmJbTSaGjK2eqh8p8zMDFx3x9LB',
      vmId: 'rWhpuQPF1kb72esV2momhMuTYGkEb1oL29pt2EBXWmSy4kxnT',
      fxIds: [],
      genesisData: testGenesisData,
    },
    context,
  );

  console.log('before', tx.getCredentials());
  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  tx.credentials = [tx.credentials[0], tx.credentials[0]];
  console.log('after', tx.getCredentials());

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
