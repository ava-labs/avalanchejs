export type GetNodeVersionReply = {
  version: string;
  databaseVersion: string;
  gitCommit: string;
  vmVersions: Map<string, string>;
};

export type Peer = {
  ip: string;
  publicIp: string;
  nodeID: string;
  version: string;
  lastSent: string;
  lastReceived: string;
  observedUptime: number;
  benched: string[];
};

export type GetTxFeeApiResponse = {
  txFee: string;
  creationTxFee: string;
  createAssetTxFee: string;
  createSubnetTxFee: string;
  createBlockchainTxFee: string;
};

export type GetTxFeeResponse = {
  txFee: bigint;
  creationTxFee: bigint;
  createAssetTxFee: bigint;
  createSubnetTxFee: bigint;
  createBlockchainTxFee: bigint;
};

export type UptimeResponse = {
  rewardingStakePercentage: string;
  weightedAveragePercentage: string;
};

export type GetNodeIdResponse = {
  nodeID: string;
};

export type GetNodeIpResponse = {
  ip: string;
};

export type GetNetworkIdResponse = {
  networkID: number;
};

export type GetNetworkNameResponse = {
  networkName: string;
};

export type GetBlockchainIDResponse = {
  blockchainID: string;
};

export type isBootstrapped = {
  isBootstrapped: boolean;
};
