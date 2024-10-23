import { addTxSignatures, pvm, utils } from '../../../src';
import { setupEtnaExample } from './utils/etna-helper';

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const P_CHAIN_ADDRESS = 'P-custom1s4k9fch6uyhvv7necq070nzljgrqvazkpgles6';
const PRIVATE_KEY =
  '0x025a930379c7a4d9258c8a39104d50389c9a59db290b3db93b3f66b85dcc2bd2';

const main = async () => {
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

main().then(console.log);
