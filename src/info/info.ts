import { AVAX_PUBLIC_URL } from '../constants/public-urls';
import { Api } from '../vms/common/baseApi';
import type {
  GetBlockchainIDResponse,
  GetNetworkIdResponse,
  GetNetworkNameResponse,
  GetNodeIdResponse,
  GetNodeIpResponse,
  GetNodeVersionReply,
  GetPeersResponse,
  GetTxFeeResponse,
  isBootstrapped,
  UptimeResponse,
} from './model';

export class Info extends Api {
  constructor(private readonly baseURL: string = AVAX_PUBLIC_URL) {
    super(baseURL, '/ext/info', 'info');
  }

  getNodeVersion(): Promise<GetNodeVersionReply> {
    return this.callRpc<GetNodeVersionReply>('getNodeVersion');
  }

  async getNodeId(): Promise<GetNodeIdResponse> {
    return this.callRpc<GetNodeIdResponse>('getNodeID');
  }

  getNodeIp(): Promise<GetNodeIpResponse> {
    return this.callRpc<GetNodeIpResponse>('getNodeIP');
  }

  getNetworkId(): Promise<GetNetworkIdResponse> {
    return this.callRpc<GetNetworkIdResponse>('getNetworkID');
  }

  getNetworkName(): Promise<GetNetworkNameResponse> {
    return this.callRpc<GetNetworkNameResponse>('getNetworkName');
  }

  getBlockchainId(alias: string): Promise<GetBlockchainIDResponse> {
    return this.callRpc<GetBlockchainIDResponse>('getBlockchainID', { alias });
  }

  peers(nodeIDs?: string[]): Promise<GetPeersResponse> {
    return this.callRpc<GetPeersResponse>('peers', { nodeIDs });
  }

  isBootstrapped(chain: string): Promise<isBootstrapped> {
    return this.callRpc<isBootstrapped>('peers', { chain });
  }
  /**
   * @link https://docs.avax.network/apis/avalanchego/apis/info#infogettxfee
   */
  async getTxFee(): Promise<GetTxFeeResponse> {
    const resp = await this.callRpc<GetTxFeeResponse>('getTxFee');

    return {
      txFee: BigInt(resp.txFee),
      createAssetTxFee: BigInt(resp.createAssetTxFee),
      createSubnetTxFee: BigInt(resp.createSubnetTxFee),
      transformSubnetTxFee: BigInt(resp.transformSubnetTxFee),
      createBlockchainTxFee: BigInt(resp.createBlockchainTxFee),
      addPrimaryNetworkValidatorFee: BigInt(resp.addPrimaryNetworkValidatorFee),
      addPrimaryNetworkDelegatorFee: BigInt(resp.addPrimaryNetworkDelegatorFee),
      addSubnetValidatorFee: BigInt(resp.addSubnetValidatorFee),
      addSubnetDelegatorFee: BigInt(resp.addSubnetDelegatorFee),
    };
  }

  uptime(): Promise<UptimeResponse> {
    return this.callRpc<UptimeResponse>('uptime');
  }

  getVMs(): Promise<Map<string, string[]>> {
    return this.callRpc<Map<string, string[]>>('getVMs');
  }
}
