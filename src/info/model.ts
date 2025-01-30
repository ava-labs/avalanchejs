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

export type GetPeersResponse = {
  numPeers: number;
  peers: Peer[];
};

export type UptimeResponse = {
  rewardingStakePercentage: string;
  weightedAveragePercentage: string;
};

export type NodePOP = {
  publicKey: string;
  proofOfPossession: string;
};

export type GetNodeIdResponse = {
  nodeID: string;
  nodePOP: NodePOP;
};

export type GetNodeIpResponse = {
  ip: string;
};

export type GetNetworkIdResponse = {
  networkID: string;
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

export type GetUpgradesInfoResponse = {
  apricotPhase1Time: string;
  apricotPhase2Time: string;
  apricotPhase3Time: string;
  apricotPhase4Time: string;
  apricotPhase4MinPChainHeight: number;
  apricotPhase5Time: string;
  apricotPhasePre6Time: string;
  apricotPhase6Time: string;
  apricotPhasePost6Time: string;
  banffTime: string;
  cortinaTime: string;
  cortinaXChainStopVertexID: string;
  durangoTime: string;
  etnaTime: string;
};
