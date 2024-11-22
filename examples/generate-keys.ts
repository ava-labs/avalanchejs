import { info, secp256k1, utils } from '../src';
import { Address } from 'micro-eth-signer';
import { getEnvVars } from './utils/getEnvVars';

type NodeIdResponse = {
  nodeID: string;
  nodePOP: { publicKey: string; proofOfPossession: string };
};

/**
 * Generate a new private/public key pair and console log out the needed environment variables
 * needed to run the examples. Please these values in a `.env` file.
 */
const main = async () => {
  const { AVAX_PUBLIC_URL } = getEnvVars();

  const privateKey = secp256k1.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey);
  const hrp = 'custom';
  const address = utils.formatBech32(
    hrp,
    secp256k1.publicKeyBytesToAddress(publicKey),
  );

  const infoApi = new info.InfoApi(AVAX_PUBLIC_URL);

  const nodeIdResponse = (await infoApi.getNodeId()) as NodeIdResponse;

  console.log('Copy the below values to your `.env` file:');
  console.log('------------------------------------------\n');

  console.log('## PUBLIC_KEY=', `"${utils.bufferToHex(publicKey)}"`);

  console.log('PRIVATE_KEY=', `"${utils.bufferToHex(privateKey)}"`);

  console.log('P_CHAIN_ADDRESS=', `"P-${address}"`);
  console.log('X_CHAIN_ADDRESS=', `"X-${address}"`);
  console.log('C_CHAIN_ADDRESS=', `"${Address.fromPublicKey(publicKey)}"`);
  console.log('CORETH_ADDRESS=', `"C-${address}"`);

  console.log('NodeId=', `"${nodeIdResponse.nodeID}"`);
  console.log('BLS_PUBLIC_KEY=', `"${nodeIdResponse.nodePOP.publicKey}"`);
  console.log(
    'BLS_SIGNATURE=',
    `"${nodeIdResponse.nodePOP.proofOfPossession}"`,
  );
};

main();
