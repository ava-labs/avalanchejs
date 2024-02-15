/* 
  this class is for shared methods between avm/pvm api's
*/

import { SignedTx } from '../../serializable/avax';
import { hexToBuffer } from '../../utils';
import type { GetAddressTxsParams, GetAddressTxsResponse } from '../avm/models';
import type { GetBalanceParams, GetBalanceResponse } from '../pvm';
import type { GetTxServerResponse } from '../pvm/privateModels';
import type {
  GetAssetDescriptionResponse,
  GetTxParams,
  GetTxStatusParams,
  GetTxStatusResponse,
} from './apiModels';
import { ChainApi } from './chainAPI';

export class AvaxApi extends ChainApi {
  getAssetDescription(assetID: string): Promise<GetAssetDescriptionResponse> {
    return this.callRpc<GetAssetDescriptionResponse>('getAssetDescription', {
      assetID,
    });
  }

  getTx = async (getTxParams: GetTxParams) => {
    const resp = await this.callRpc<GetTxServerResponse>('getTx', {
      ...getTxParams,
      encoding: 'hex',
    });
    return this.manager.unpack(hexToBuffer(resp.tx), SignedTx);
  };

  getTxJson = (getTxParams: GetTxParams) => {
    return this.callRpc<GetTxServerResponse>('getTx', {
      ...getTxParams,
      encoding: 'json',
    });
  };

  getTxStatus(getTxStatus: GetTxStatusParams): Promise<GetTxStatusResponse> {
    return this.callRpc<GetTxStatusResponse>('getTxStatus', {
      includeReason: true,
      ...getTxStatus,
    });
  }

  getBalance(getBalanceParams: GetBalanceParams): Promise<GetBalanceResponse> {
    return this.callRpc<GetBalanceResponse>('getBalance', getBalanceParams);
  }

  getAddressTxs(
    GetAddressTxsParams: GetAddressTxsParams,
  ): Promise<GetAddressTxsResponse> {
    return this.callRpc<GetAddressTxsResponse>(
      'GetAddressTxs',
      GetAddressTxsParams,
    );
  }
}
