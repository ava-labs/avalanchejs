import { InfoApi } from '../../info';
import { getHRP } from '../../constants/networkIDs';
import { Id } from '../../serializable/fxs/common/id';
import { AVMApi } from '../avm/api';
import { PVMApi } from '../pvm';
import type { Context } from './model';

/**
 * Rejects an identifier the node did not return in a usable form.
 *
 * The node is untrusted, and these strings are frozen into the Context that
 * every builder reuses for the life of the session. They are decoded on every
 * transaction build, so an unusable one must fail here, once, rather than on
 * each builder call. Decoding also bounds the string: base58 decoding is
 * quadratic in the input length, so a multi-hundred-KB "blockchainID" would
 * otherwise block the JS thread on every build.
 */
const requireValidId = (value: string, field: string): string => {
  try {
    Id.fromString(value);
  } catch (error) {
    throw new Error(
      `node returned an invalid ${field}: ${(error as Error).message}`,
    );
  }

  return value;
};

/*
grabs some basic info about an avm chain
*/
export const getContextFromURI = async (
  baseURL?: string,
  assetDescription = 'AVAX',
): Promise<Context> => {
  const pChainApi = new PVMApi(baseURL);
  const xChainApi = new AVMApi(baseURL);
  const { assetID: avaxAssetID } = await xChainApi.getAssetDescription(
    assetDescription,
  );
  const info = new InfoApi(baseURL);
  const { txFee, createAssetTxFee } = await xChainApi.getTxFee();

  const { blockchainID: xBlockchainID } = await info.getBlockchainId('X');
  const { blockchainID: pBlockchainID } = await info.getBlockchainId('P');
  const { blockchainID: cBlockchainID } = await info.getBlockchainId('C');

  const { networkID: networkIDstring } = await info.getNetworkId();
  const networkID = Number(networkIDstring);

  const platformFeeConfig = await pChainApi.getFeeConfig();

  return Object.freeze({
    xBlockchainID: requireValidId(xBlockchainID, 'xBlockchainID'),
    pBlockchainID: requireValidId(pBlockchainID, 'pBlockchainID'),
    cBlockchainID: requireValidId(cBlockchainID, 'cBlockchainID'),
    avaxAssetID: requireValidId(avaxAssetID, 'avaxAssetID'),
    baseTxFee: txFee,
    createAssetTxFee: createAssetTxFee,
    networkID,
    hrp: getHRP(networkID),
    platformFeeConfig,
  });
};
