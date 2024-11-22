import {
  L1Validator,
  PChainOwner,
  addTxSignatures,
  pvm,
  pvmSerial,
  utils,
} from '../../../src';
import { setupEtnaExample } from './utils/etna-helper';
import { getEnvVars } from '../../utils/getEnvVars';

const AMOUNT_TO_VALIDATE_AVAX: number = 1;
const BALANCE_AVAX: number = 1;

/**
 * Converts a subnet to L1.
 *
 * **Note** A subnet must be created (createSubnetTx) and a chain must be created (createChainTx)
 * before a subnet can be converted from permissioned to permissionless.
 * @param BLS_PUBLIC_KEY BLS key from info.getNodeID on AVAX_PUBLIC_URL
 * @param BLS_SIGNATURE BLS signature from info.getNodeID on AVAX_PUBLIC_URL
 * @param NODE_ID the ID of the node from info.getNodeID on AVAX_PUBLIC_URL.
 * @param chainId the ID of the chain that is created via `createChainTx`.
 * @param subnetId the ID of the subnet that is created via `createSubnetTx`.
 * @returns The resulting transaction's ID.
 */
const convertSubnetToL1TxExample = async () => {
  const {
    AVAX_PUBLIC_URL,
    P_CHAIN_ADDRESS,
    PRIVATE_KEY,
    NODE_ID,
    BLS_PUBLIC_KEY,
    BLS_SIGNATURE,
  } = getEnvVars(['BLS_PUBLIC_KEY', 'BLS_SIGNATURE', 'NODE_ID']);
  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const pChainOwner = PChainOwner.fromNative([testPAddr], 1);

  const publicKey = utils.hexToBuffer(BLS_PUBLIC_KEY);

  const signature = utils.hexToBuffer(BLS_SIGNATURE);

  const signer = new pvmSerial.ProofOfPossession(publicKey, signature);

  const validator = L1Validator.fromNative(
    NODE_ID,
    BigInt(AMOUNT_TO_VALIDATE_AVAX * 1e9),
    BigInt(BALANCE_AVAX * 1e9),
    signer,
    pChainOwner,
    pChainOwner,
  );

  const tx = pvm.e.newConvertSubnetToL1Tx(
    {
      feeState,
      fromAddressesBytes: [testPAddr],
      subnetId: '', // subnetId from createSubnetTx
      utxos,
      chainId: '', // chainId from createChainTx
      validators: [validator],
      subnetAuth: [0],
      address: testPAddr,
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

convertSubnetToL1TxExample().then(console.log);
