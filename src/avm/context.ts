import { getHRP } from '../constants/networkIDs';
import { Info } from '../info/info';
import type { AVMContext } from './models';
import { AVMApi } from './x-chain';

/* 
grabs some basic info about an avm chain
*/
export const getAVMContextFromURI = async (
  assetID: string,
  baseURL?: string,
): Promise<AVMContext> => {
  const xChainApi = new AVMApi(baseURL);
  const { assetId: avaxAssetID } = await xChainApi.getAssetDescription(assetID);
  const info = new Info(baseURL);
  const { txFee: baseTxFee, createAssetTxFee } = await info.getTxFee();
  const { blockchainID } = await info.getBlockchainId('X');
  const { networkID } = await info.getNetworkId();

  return Object.freeze({
    blockchainID,
    avaxAssetID,
    baseTxFee,
    createAssetTxFee,
    networkID,
    hrp: getHRP(networkID),
  });
};
