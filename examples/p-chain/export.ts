import { TransferableOutput } from '../../src/serializable/avax';
import { addTxSignatures } from '../../src/signer';
import { bech32ToBytes, hexToBuffer } from '../../src/utils';
import { getContextFromURI } from '../../src/vms/context';
import { newExportTx } from '../../src/vms/pvm';
import { pvmapi } from '../chain_apis';
import { getChainIdFromContext } from '../utils/getChainIdFromContext';

const P_CHAIN_ADDRESS = process.env.P_CHAIN_ADDRESS;
const X_CHAIN_ADDRESS = process.env.X_CHAIN_ADDRESS;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const main = async () => {
  if (!P_CHAIN_ADDRESS || !X_CHAIN_ADDRESS || !PRIVATE_KEY) {
    throw new Error('Missing environment variable(s).');
  }

  const context = await getContextFromURI(process.env.AVAX_PUBLIC_URL);

  const { utxos } = await pvmapi.getUTXOs({
    addresses: [P_CHAIN_ADDRESS],
  });

  const tx = newExportTx(
    context,
    getChainIdFromContext('X', context),
    [bech32ToBytes(P_CHAIN_ADDRESS)],
    utxos,
    [
      TransferableOutput.fromNative(context.avaxAssetID, BigInt(0.1 * 1e9), [
        bech32ToBytes(X_CHAIN_ADDRESS),
      ]),
    ],
  );

  await addTxSignatures({
    unsignedTx: tx,
    privateKeys: [hexToBuffer(PRIVATE_KEY)],
  });

  return pvmapi.issueSignedTx(tx.getSignedTx());
};

main().then(console.log);
