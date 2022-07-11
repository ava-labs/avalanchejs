import { getHRP } from '../../constants/networkIDs';
import { Info } from '../../info/info';
import { AVMApi } from '../avm/x-chain';
import type { Context } from './model';

/* 
grabs some basic info about an avm chain
*/
export const getContextFromURI = async (
  assetID: string,
  baseURL?: string,
): Promise<Context> => {
  const xChainApi = new AVMApi(baseURL);
  const { assetID: avaxAssetID } = await xChainApi.getAssetDescription(assetID);
  const info = new Info(baseURL);
  const {
    txFee: baseTxFee,
    createAssetTxFee,
    createSubnetTxFee,
    createBlockchainTxFee,
  } = await info.getTxFee();
  const { blockchainID: xBlockchainID } = await info.getBlockchainId('X');
  const { blockchainID: pBlockchainID } = await info.getBlockchainId('P');
  const { blockchainID: cBlockchainID } = await info.getBlockchainId('C');

  const { networkID } = await info.getNetworkId();

  return Object.freeze({
    xBlockchainID,
    pBlockchainID,
    cBlockchainID,
    avaxAssetID,
    baseTxFee,
    createAssetTxFee,
    createSubnetTxFee,
    createBlockchainTxFee,
    networkID,
    hrp: getHRP(networkID),
  });
};
