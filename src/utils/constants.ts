/**
 * @packageDocumentation
 * @module Utils-Constants
 */

import BN from "bn.js"

export const DefaultNetworkID = 1

export const PrivateKeyPrefix: string = "PrivateKey-"
export const NodeIDPrefix: string = "NodeID-"
export const XChainAlias: string = "X"
export const CChainAlias: string = "C"
export const PChainAlias: string = "P"
export const XChainVMName: string = "avm"
export const CChainVMName: string = "evm"
export const PChainVMName: string = "platformvm"

export const TestHRP = "local"
export const TestNetworkID = 12345
export const TestAvaxAssetID =
  "2fombhL7aGPwj3KH4bfrmJwW6PVnMobf9Y2fn9GwxiAAJyFDbe"
export const DefaultPlatformChainID: string =
  "11111111111111111111111111111111LpoYY"
export const TestXBlockchainID =
  "2eNy1mUFdmaxXNj1eQHUe7Np4gju9sJsEtWQ4MX3ToiNKuADed"
export const TestCBlockchainID =
  "2CA6j5zYzasynPsFeNoqWkmTCt3VScMvXUZHbfDJ8k3oGzAPtU"
export const TestCChainID = 42112
export const DummyBlockchainID =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
export const DummyPlatformChainID: string =
  "11111111111111111111111111111111LpoXX"

// DO NOT use the following private keys and/or mnemonic on Fuji or Testnet
// This address/account is for testing on the local camsh network
export const DefaultLocalGenesisPrivateKey: string =
  "ewoqjP7PxY4yr3iLTpLisriqt94hdyDFNgchSxGGztUrTXtNN"
export const DefaultLocalGenesisPrivateKey2: string =
  "vmRQiZeXEXYMyJhEiqdC2z5JhuDbxL8ix9UVvjgMu2Er1NepE"
export const DefaultEVMLocalGenesisPrivateKey: string =
  "0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027"
export const DefaultEVMLocalGenesisAddress: string =
  "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
export const mnemonic: string =
  "output tooth keep tooth bracket fox city sustain blood raise install pond stem reject long scene clap gloom purpose mean music piece unknown light"

export const ONEAVAX: BN = new BN(1000000000)
export const DECIAVAX: BN = ONEAVAX.div(new BN(10))
export const CENTIAVAX: BN = ONEAVAX.div(new BN(100))
export const MILLIAVAX: BN = ONEAVAX.div(new BN(1000))
export const MICROAVAX: BN = ONEAVAX.div(new BN(1000000))
export const NANOAVAX: BN = ONEAVAX.div(new BN(1000000000))

export const WEI: BN = new BN(1)
export const GWEI: BN = WEI.mul(new BN(1000000000))
export const AVAXGWEI: BN = NANOAVAX.clone()
export const AVAXSTAKECAP: BN = ONEAVAX.mul(new BN(3000000))

/**
 * Rules used when merging sets
 */
export type MergeRule =
  | "intersection" // Self INTERSECT New
  | "differenceSelf" // Self MINUS New
  | "differenceNew" // New MINUS Self
  | "symDifference" // differenceSelf UNION differenceNew
  | "union" // Self UNION New
  | "unionMinusNew" // union MINUS differenceNew
  | "unionMinusSelf" // union MINUS differenceSelf
  | "ERROR" // generate error for testing
