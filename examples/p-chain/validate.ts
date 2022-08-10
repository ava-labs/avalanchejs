import { AVAX_PUBLIC_URL_FUJI } from '../../src/constants/public-urls';
import { Secp256K1Keychain } from '../../src/signer';
import { bech32ToBytes, hexToBuffer, printDeep } from '../../src/utils';
import { PVMApi, PVMBuilder } from '../../src/vms/pvm';
import { pAddress, privateKey } from '../example_accounts';

const delegate = async () => {
  const api = new PVMApi(AVAX_PUBLIC_URL_FUJI);
  const { utxos } = await api.getUTXOs({ addresses: [pAddress] });
  const builder = await PVMBuilder.fromURI(AVAX_PUBLIC_URL_FUJI);
  const keyChain = new Secp256K1Keychain([hexToBuffer(privateKey)]);
  const startTime = BigInt(Math.floor(new Date().getTime() / 1000) + 60);
  const endTime = startTime + BigInt(60 * 60 * 24 * 21);

  const nodeID = 'NodeID-HKLp5269LH8DcrLvNDoJquQs2w1LwLCga'; // be sure to generate a new base54 nodeID each time

  const tx = builder.newAddValidatorTx(
    utxos,
    [bech32ToBytes(pAddress)],
    nodeID,
    startTime,
    endTime,
    BigInt(1e9),
    [bech32ToBytes(pAddress)],
    1e4 * 20,
  );
  printDeep(tx);
  await keyChain.addSignatures(tx);
  return api.issueSignedTx(tx.getSignedTx());
};

delegate().then(console.log);
