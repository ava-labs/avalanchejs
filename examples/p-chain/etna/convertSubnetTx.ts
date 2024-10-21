import {
  Address,
  addTxSignatures,
  Bytes,
  Int,
  networkIDs,
  NodeId,
  pvm,
  utils,
} from '../../../src';
import { PChainOwner } from '../../../src/serializable/fxs/pvm/pChainOwner';
// import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';
import { BigIntPr } from '../../../src/serializable/primitives/bigintpr';
import { ConvertSubnetValidator } from '../../../src/serializable/fxs/pvm/convertSubnetValidator';
import { ProofOfPossession } from '../../../src/serializable/pvm';
import { getPVMManager } from '../../../src/serializable/pvm/codec';

const AMOUNT_TO_VALIDATE_AVAX: number = 1;
const BALANCE_AVAX: number = 100;

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const P_CHAIN_ADDRESS = 'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs';
const PRIVATE_KEY =
  '0x434ff9ff91a000671dd4c9b9021192f795658a013e3793ee2cd504537a78be6e';

const main = async () => {
  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const pChainOwner = new PChainOwner(new Int(1), [new Address(testPAddr)]);
  const nodeId = 'NodeID-MqgFXT8JhorbEW2LpTDGePBBhv55SSp3M';

  const publicKey = utils.hexToBuffer(
    '0x8f95423f7142d00a48e1014a3de8d28907d420dc33b3052a6dee03a3f2941a393c2351e354704ca66a3fc29870282e15',
  );

  const signature = utils.hexToBuffer(
    '0x86a3ab4c45cfe31cae34c1d06f212434ac71b1be6cfe046c80c162e057614a94a5bc9f1ded1a7029deb0ba4ca7c9b71411e293438691be79c2dbf19d1ca7c3eadb9c756246fc5de5b7b89511c7d7302ae051d9e03d7991138299b5ed6a570a98',
  );

  const signer = new ProofOfPossession(publicKey, signature);

  const validator = ConvertSubnetValidator.fromNative(
    nodeId,
    BigInt(AMOUNT_TO_VALIDATE_AVAX * 1e9),
    BigInt(BALANCE_AVAX * 1e9),
    signer,
    pChainOwner,
    pChainOwner,
  );

  console.log('byteLength', nodeId.length);

  const tx = pvm.e.newConvertSubnetTx(
    {
      feeState,
      fromAddressesBytes: [testPAddr],
      subnetId: networkIDs.FallbackHRP.toString(),
      utxos,
      chainId: networkIDs.FallbackHRP.toString(),
      validators: [validator],
      subnetAuth: [1],
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

// main();

main().then(console.log);
