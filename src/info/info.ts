import { Api } from '../vms/common/api';
import { AVAX_PUBLIC_URL } from '../constants/public-urls';
import type {
  GetBlockchainIDResponse,
  GetNetworkIdResponse,
  GetNetworkNameResponse,
  GetNodeIdResponse,
  GetNodeIpResponse,
  GetNodeVersionReply,
  GetTxFeeResponse,
  isBootstrapped,
  Peer,
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

  peers(nodeIDs: string[]): Promise<Peer[]> {
    return this.callRpc<Peer[]>('peers', { nodeIDs });
  }

  isBootstrapped(chain: string): Promise<isBootstrapped> {
    return this.callRpc<isBootstrapped>('peers', { chain });
  }

  async getTxFee(): Promise<GetTxFeeResponse> {
    const resp = await this.callRpc<GetTxFeeResponse>('getTxFee');
    return {
      createAssetTxFee: BigInt(resp.createAssetTxFee),
      createSubnetTxFee: BigInt(resp.createSubnetTxFee),
      createBlockchainTxFee: BigInt(resp.createBlockchainTxFee),
      creationTxFee: BigInt(resp.creationTxFee),
      txFee: BigInt(resp.txFee),
    };
  }

  uptime(): Promise<UptimeResponse> {
    return this.callRpc<UptimeResponse>('uptime');
  }

  getVMs(): Promise<Map<string, string[]>> {
    return this.callRpc<Map<string, string[]>>('getVMs');
  }
}
