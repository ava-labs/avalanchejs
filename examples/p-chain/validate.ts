import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newAddValidatorTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import {
  pAddressForExamples,
  privateKeyForExamples,
} from '../example_accounts';

const delegate = async () => {
  const { utxos } = await pvmapi.getUTXOs({ addresses: [pAddressForExamples] });
  const context = await getContextFromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([hexToBuffer(privateKeyForExamples)]);
  const startTime = BigInt(Math.floor(new Date().getTime() / 1000) + 60);
  const endTime = startTime + BigInt(60 * 60 * 24 * 21);

  const nodeID = 'NodeID-HKLp5269LH8DcrLvNDoJquQs2w1LwLCga'; // be sure to generate a new base54 nodeID each time

  const tx = newAddValidatorTx(
    context,
    utxos,
    [bech32ToBytes(pAddressForExamples)],
    nodeID,
    startTime,
    endTime,
    BigInt(1e9),
    [bech32ToBytes(pAddressForExamples)],
    1e4 * 20,
  );
  printDeep(tx);
  await keyChain.addSignatures(tx);
  return pvmapi.issueSignedTx(tx.getSignedTx());
};

delegate().then(console.log);
