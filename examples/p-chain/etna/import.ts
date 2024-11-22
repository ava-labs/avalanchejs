import { addTxSignatures, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';

const main = async () => {
  const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY, X_CHAIN_ADDRESS } =
    getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({
    sourceChain: 'X',
    addresses: [P_CHAIN_ADDRESS],
  });

  const importTx = pvm.e.newImportTx(
    {
      feeState,
      fromAddressesBytes: [utils.bech32ToBytes(X_CHAIN_ADDRESS)],
      sourceChainId: context.xBlockchainID,
      toAddressesBytes: [utils.bech32ToBytes(P_CHAIN_ADDRESS)],
      utxos,
    },
    context,
  );

  await addTxSignatures({
    unsignedTx: importTx,
    privateKeys: [utils.hexToBuffer(PRIVATE_KEY)],
  });

  return pvmApi.issueSignedTx(importTx.getSignedTx());
};

main().then(console.log);
