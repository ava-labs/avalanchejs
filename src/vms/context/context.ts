import { getHRP } from '../../constants/networkIDs';
import { Info } from '../../info/info';
import { AVMApi } from '../avm/api';
import type { Context } from './model';

/*
grabs some basic info about an avm chain
*/
export const getContextFromURI = async (
  baseURL?: string,
  assetDescription = 'AVAX',
): Promise<Context> => {
  const xChainApi = new AVMApi(baseURL);
  const { assetID: avaxAssetID } = await xChainApi.getAssetDescription(
    assetDescription,
  );
  const info = new Info(baseURL);
  const {
    txFee: baseTxFee,
    createAssetTxFee,
    createSubnetTxFee,
    transformSubnetTxFee,
    createBlockchainTxFee,
    addPrimaryNetworkValidatorFee,
    addPrimaryNetworkDelegatorFee,
    addSubnetValidatorFee,
    addSubnetDelegatorFee,
  } = await info.getTxFee();
  const { blockchainID: xBlockchainID } = await info.getBlockchainId('X');
  const { blockchainID: pBlockchainID } = await info.getBlockchainId('P');
  const { blockchainID: cBlockchainID } = await info.getBlockchainId('C');

  const { networkID } = await info.getNetworkId();
  const networkIDNum = Number.parseInt(networkID);

  return Object.freeze({
    xBlockchainID,
    pBlockchainID,
    cBlockchainID,
    avaxAssetID,
    baseTxFee,
    createAssetTxFee,
    createSubnetTxFee,
    transformSubnetTxFee,
    createBlockchainTxFee,
    addPrimaryNetworkValidatorFee,
    addPrimaryNetworkDelegatorFee,
    addSubnetValidatorFee,
    addSubnetDelegatorFee,
    networkID: networkIDNum,
    hrp: getHRP(networkIDNum),
  });
};
