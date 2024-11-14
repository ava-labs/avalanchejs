import { addTxSignatures, pvm, utils } from '../../../src';
import { setupEtnaExample } from './utils/etna-helper';
import { getEnvVars } from '../../utils/getEnvVars';

const BALANCE_AVAX: number = 1;
const VALIDATION_ID: string = '';

const increaseBalanceTx = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY } = getEnvVars();
  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const unsignedTx = pvm.e.newIncreaseL1ValidatorBalanceTx(
    {
      balance: BigInt(BALANCE_AVAX * 1e9),
      feeState,
      fromAddressesBytes: [testPAddr],
      utxos,
      validationId: VALIDATION_ID,
    },
    context,
  );

  await addTxSignatures({
    unsignedTx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(unsignedTx.getSignedTx());
};

await increaseBalanceTx().then(console.log);
