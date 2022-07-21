/* 
  this class is for shared methods between avm/pvm api's
*/

import { SignedTx } from '../../serializable/avm';
import { hexToBuffer } from '../../utils';
import type { GetTxServerResponse } from '../pvm/privateModels';
import type { GetAssetDescriptionResponse, GetTxParams } from './apiModels';
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
}
