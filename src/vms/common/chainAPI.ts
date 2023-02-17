/* 
  this class includes methods that are shared between all three chains/vms
*/

import { AVAX_PUBLIC_URL } from '../../constants/public-urls';
import type { SignedTx } from '../../serializable/avax';
import { Utxo } from '../../serializable/avax/utxo';
import type { Manager } from '../../serializable/codec';
import { addChecksum } from '../../utils';
import { bufferToHex, hexToBuffer } from '../../utils/buffer';
import type {
  GetUTXOsApiResp,
  GetUTXOsInput,
  IssueTxParams,
  IssueTxResponse,
} from './apiModels';
import { Api } from './baseApi';

export abstract class ChainApi extends Api {
  constructor(
    baseURL: string = AVAX_PUBLIC_URL,
    protected path: string,
    protected base: string,
    protected manager: Manager,
  ) {
    super(baseURL, path, base);
  }

  async getUTXOs(input: GetUTXOsInput) {
    const resp = await this.callRpc<GetUTXOsApiResp>('getUTXOs', {
      ...input,
      encoding: 'hex',
    });
    const utxos = resp.utxos.map((utxoHex) =>
      this.manager.unpack(hexToBuffer(utxoHex), Utxo),
    );

    return {
      ...resp,
      utxos,
    };
  }

  issueTx(issueTxParams: IssueTxParams): Promise<IssueTxResponse> {
    return this.callRpc<IssueTxResponse>('issueTx', issueTxParams);
  }

  issueSignedTx(tx: SignedTx): Promise<IssueTxResponse> {
    return this.issueTx({
      tx: bufferToHex(addChecksum(tx.toBytes())),
    });
  }
}
