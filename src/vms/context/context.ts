import { InfoApi } from '../../info';
import { getHRP } from '../../constants/networkIDs';
import { AVMApi } from '../avm/api';
import { PVMApi } from '../pvm';
import type { Context } from './model';

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

  const { networkID: networkIDstring } = await info.getNetworkId();
  const networkID = Number(networkIDstring);

  const platformFeeConfig = await pChainApi.getFeeConfig();

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
    networkID,
    hrp: getHRP(networkID),
    platformFeeConfig,
  });
};
