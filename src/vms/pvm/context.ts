import { AVMApi } from '../avm/x-chain';
import { getHRP } from '../../constants/networkIDs';
import { Info } from '../../info/info';
import type { PVMContext } from './models';

/* 
grabs some basic info about an avm chain
*/
export const getPVMContextFromURI = async (
  assetID: string,
  baseURL?: string,
): Promise<PVMContext> => {
  const xChainApi = new AVMApi(baseURL);
  const { assetId: avaxAssetID } = await xChainApi.getAssetDescription(assetID);
  const info = new Info(baseURL);
  const {
    txFee: baseTxFee,
    createSubnetTxFee,
    createBlockchainTxFee,
  } = await info.getTxFee();
  const { blockchainID } = await info.getBlockchainId('X');
  const { networkID } = await info.getNetworkId();

  return Object.freeze({
    networkID,
    avaxAssetID,
    baseTxFee,
    blockchainID,
    createSubnetTxFee,
    createBlockchainTxFee,
    hrp: getHRP(networkID),
  });
};
