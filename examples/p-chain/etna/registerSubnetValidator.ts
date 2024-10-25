import { addTxSignatures, pvm, utils } from '../../../src';
import { PChainOwner } from '../../../src/serializable/fxs/pvm/pChainOwner';
import { RegisterSubnetValidator } from '../../../src/serializable/pvm/registerSubnetValidator';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';

const BALANCE_AVAX = BigInt(1 * 1e9);
const SUBNET_ID = '';
const NODE_ID = '';
const WEIGHT = 1n;

const registerSubnetValidator = async () => {
  const {
    AVAX_PUBLIC_URL,
    P_CHAIN_ADDRESS,
    PRIVATE_KEY,
    BLS_PUBLIC_KEY,
    BLS_SIGNATURE,
  } = getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const publicKey = utils.hexToBuffer(BLS_PUBLIC_KEY);

  const blsSignature = utils.hexToBuffer(BLS_SIGNATURE);

  const pChainOwner = PChainOwner.fromNative([testPAddr], 1);

  const message = RegisterSubnetValidator.fromNative(
    SUBNET_ID,
    NODE_ID,
    publicKey,
    1212n,
    pChainOwner,
    pChainOwner,
    WEIGHT,
  );

  const tx = pvm.e.newRegisterSubnetValidatorTx(
    {
      feeState,
      fromAddressesBytes: [testPAddr],
      balance: BALANCE_AVAX,
      blsSignature,
      message,
      utxos,
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

registerSubnetValidator().then(console.log);
