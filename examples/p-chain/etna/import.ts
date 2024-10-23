import { addTxSignatures, pvm, utils } from '../../../src';
import { getEnvVars } from '../../utils/getEnvVars';
import { setupEtnaExample } from './utils/etna-helper';
import { FallbackHRP } from '../../../src/constants/networkIDs';

const AVAX_PUBLIC_URL = 'https://etna.avax-dev.network';
const P_CHAIN_ADDRESS = 'P-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs';
const PRIVATE_KEY =
  '0x434ff9ff91a000671dd4c9b9021192f795658a013e3793ee2cd504537a78be6e';
const C_CHAIN_ADDRESS = 'C-custom1p8ddr5wfmfq0zv3n2wnst0cm2pfccaudm3wsrs'; //0xa65Edcc54181CF263A4DbB9AEcB5cF1b444ABF0a';

const main = async () => {
  // const { AVAX_PUBLIC_URL, P_CHAIN_ADDRESS, PRIVATE_KEY, C_CHAIN_ADDRESS } =
  //   getEnvVars();

  const { context, feeState, pvmApi } = await setupEtnaExample(AVAX_PUBLIC_URL);

  const { utxos } = await pvmApi.getUTXOs({
    sourceChain: 'C',
    addresses: [P_CHAIN_ADDRESS],
  });

  const importTx = pvm.e.newImportTx(
    {
      feeState,
      fromAddressesBytes: [utils.bech32ToBytes(C_CHAIN_ADDRESS)],
      sourceChainId: context.cBlockchainID,
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
