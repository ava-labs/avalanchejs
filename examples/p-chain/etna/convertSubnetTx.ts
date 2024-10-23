import { addTxSignatures, pvm, utils } from '../../../src';
import { setupEtnaExample } from './utils/etna-helper';
import { ConvertSubnetValidator } from '../../../src/serializable/fxs/pvm/convertSubnetValidator';
import { ProofOfPossession } from '../../../src/serializable/pvm';
import { PChainOwner } from '../../../src/serializable/fxs/pvm/pChainOwner';
import {
  blsPublicKeyBytes,
  blsSignatureBytes,
} from '../../../src/fixtures/primitives';

const AMOUNT_TO_VALIDATE_AVAX: number = 1;
const BALANCE_AVAX: number = 1;

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const P_CHAIN_ADDRESS = 'P-custom1s4k9fch6uyhvv7necq070nzljgrqvazkpgles6';
const PRIVATE_KEY =
  '0x025a930379c7a4d9258c8a39104d50389c9a59db290b3db93b3f66b85dcc2bd2';

const main = async () => {
  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({ addresses: [P_CHAIN_ADDRESS] });

  const testPAddr = utils.bech32ToBytes(P_CHAIN_ADDRESS);

  const pChainOwner = PChainOwner.fromNative([testPAddr], 1);
  const nodeId = 'NodeID-7eRvnfs2a2PvrPHUuCRRpPVAoVjbWxaFG';

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

  const tx = pvm.e.newConvertSubnetTx(
    {
      feeState,
      fromAddressesBytes: [testPAddr],
      subnetId: 'Us4d9tR3JD6q8wbPAjzUMkCmJbTSaGjK2eqh8p8zMDFx3x9LB',
      utxos,
      chainId: 'h5vH4Zz53MTN2jf72axZCfo1VbG1cMR6giR4Ra2TTpEmqxDWB',
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

  // tx.credentials = [tx.credentials[0], tx.credentials[0]];
  // console.log('after', tx.getCredentials());

  return pvmApi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
