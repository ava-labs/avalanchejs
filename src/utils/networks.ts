/**
 * @packageDocumentation
 * @module Utils-Networks
 */

import BN from "bn.js"
import {
  CChainAlias,
  CChainVMName,
  CENTIAVAX,
  DefaultNetworkID,
  GWEI,
  MILLIAVAX,
  ONEAVAX,
  PChainAlias,
  PChainVMName,
  XChainAlias,
  XChainVMName,
  DefaultPlatformChainID,
  TestAvaxAssetID,
  TestCBlockchainID,
  TestHRP,
  TestNetworkID,
  TestXBlockchainID
} from "./constants"

export interface C {
  blockchainID: string
  alias: string
  vm: string
  fee?: BN
  gasPrice: BN | number
  chainID?: number
  minGasPrice?: BN
  maxGasPrice?: BN
  txBytesGas?: number
  costPerSignature?: number
  txFee?: BN
}

export interface X {
  blockchainID: string
  alias: string
  vm: string
  creationTxFee: BN | number
  avaxAssetID: string
  avaxAssetAlias: string
  txFee?: BN | number
  fee?: BN
  mintTxFee?: BN | number
}

export interface P {
  blockchainID: string
  alias: string
  vm: string
  creationTxFee: BN | number
  createSubnetTx: BN | number
  createChainTx: BN | number
  minConsumption: number
  maxConsumption: number
  maxStakingDuration: BN
  maxSupply: BN
  minStake: BN
  minStakeDuration: number
  maxStakeDuration: number
  minDelegationStake: BN
  minDelegationFee: BN
  txFee?: BN | number
  fee?: BN
  verifyNodeSignature: boolean
  lockModeBondDeposit: boolean
}

export interface Network {
  preDefined?: boolean
  hrp: string
  C: C
  X: X
  P: P
}

export interface Chain {
  alias: string
  id: string
}

const TestNetwork: Network = {
  preDefined: true,
  hrp: TestHRP,
  X: {
    blockchainID: TestXBlockchainID,
    alias: XChainAlias,
    vm: XChainVMName,
    avaxAssetID: TestAvaxAssetID,
    avaxAssetAlias: "AVAX",
    txFee: MILLIAVAX,
    creationTxFee: CENTIAVAX,
    mintTxFee: MILLIAVAX
  },
  P: {
    blockchainID: DefaultPlatformChainID,
    alias: PChainAlias,
    vm: PChainVMName,
    txFee: MILLIAVAX,
    creationTxFee: CENTIAVAX,
    createSubnetTx: ONEAVAX,
    createChainTx: ONEAVAX,
    minConsumption: 0.1,
    maxConsumption: 0.12,
    maxStakingDuration: new BN(31536000),
    maxSupply: new BN(720000000).mul(ONEAVAX),
    minStake: ONEAVAX,
    minStakeDuration: 24 * 60 * 60, //one day
    maxStakeDuration: 365 * 24 * 60 * 60, // one year
    minDelegationStake: ONEAVAX,
    minDelegationFee: new BN(2),
    verifyNodeSignature: false,
    lockModeBondDeposit: false
  },
  C: {
    blockchainID: TestCBlockchainID,
    alias: CChainAlias,
    vm: CChainVMName,
    txBytesGas: 1,
    costPerSignature: 1000,
    txFee: MILLIAVAX,
    gasPrice: GWEI.mul(new BN(225)),
    minGasPrice: GWEI.mul(new BN(25)),
    maxGasPrice: GWEI.mul(new BN(1000)),
    chainID: 43112
  }
}

// Does not support p:getConfiguration
const AvaxMainNetwork: Network = {
  preDefined: true,
  hrp: "avax",
  X: {
    blockchainID: "2oYMBNV4eNHyqk2fjjV5nVQLDbtmNJzq5s3qs3Lo6ftnC6FByM",
    alias: XChainAlias,
    vm: XChainVMName,
    avaxAssetID: "FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z",
    avaxAssetAlias: "AVAX",
    txFee: MILLIAVAX,
    creationTxFee: CENTIAVAX,
    mintTxFee: MILLIAVAX
  },
  P: {
    blockchainID: DefaultPlatformChainID,
    alias: PChainAlias,
    vm: PChainVMName,
    txFee: MILLIAVAX,
    creationTxFee: CENTIAVAX,
    createSubnetTx: ONEAVAX,
    createChainTx: ONEAVAX,
    minConsumption: 0.1,
    maxConsumption: 0.12,
    maxStakingDuration: new BN(31536000),
    maxSupply: new BN(720000000).mul(ONEAVAX),
    minStake: ONEAVAX.mul(new BN(2000)),
    minStakeDuration: 2 * 7 * 24 * 60 * 60, //one day
    maxStakeDuration: 365 * 24 * 60 * 60, // one year
    minDelegationStake: ONEAVAX.mul(new BN(25)),
    minDelegationFee: new BN(2),
    verifyNodeSignature: false,
    lockModeBondDeposit: false
  },
  C: {
    blockchainID: "2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5",
    alias: CChainAlias,
    vm: CChainVMName,
    txBytesGas: 1,
    costPerSignature: 1000,
    txFee: MILLIAVAX,
    gasPrice: GWEI.mul(new BN(225)),
    minGasPrice: GWEI.mul(new BN(25)),
    maxGasPrice: GWEI.mul(new BN(1000)),
    chainID: 43114
  }
}

/**
 * A class for storing predefined / fetched networks
 */
class Networks {
  registry: Map<string, Network> = new Map()

  constructor() {
    this.registerNetwork(DefaultNetworkID, AvaxMainNetwork)
    this.registerNetwork(TestNetworkID, TestNetwork)
  }

  registerNetwork(networkID: number, network: Network): void {
    this.registry[networkID.toString()] = network
  }

  getNetwork(networkID: number): Network {
    return this.registry[networkID.toString()]
  }

  isPredefined(networkID: number): boolean {
    return this.registry[networkID.toString()]?.preDefined ?? false
  }
}

export default new Networks()
