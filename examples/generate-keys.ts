import { secp256k1, utils } from '../src';
import { Address } from 'micro-eth-signer';

/**
 * Generate a new private/public key pair and console log out the needed environment variables
 * needed to run the examples. Please these values in a `.env` file.
 */
const main = async () => {
  const privateKey = secp256k1.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey);

  const hrp = 'custom';
  const address = utils.formatBech32(
    hrp,
    secp256k1.publicKeyBytesToAddress(publicKey),
  );

  console.log('Copy the below values to your `.env` file:');
  console.log('------------------------------------------\n');

  console.log('## PUBLIC_KEY=', `"${utils.bufferToHex(publicKey)}"`);

  console.log('PRIVATE_KEY=', `"${utils.bufferToHex(privateKey)}"`);

  console.log('P_CHAIN_ADDRESS=', `"P-${address}"`);
  console.log('X_CHAIN_ADDRESS=', `"X-${address}"`);
  console.log('C_CHAIN_ADDRESS=', `"${Address.fromPublicKey(publicKey)}"`);
  console.log('CORETH_ADDRESS=', `"C-${address}"`);
};

main();
