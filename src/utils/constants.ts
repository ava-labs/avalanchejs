/**
 * @packageDocumentation
 * @module Utils-Constants
 */

import BN from "bn.js";

export const PrivateKeyPrefix:string = "PrivateKey-";

export const NodeIDPrefix:string = "NodeID-";

export const PrimaryAssetAlias:string = "AVAX";

export const NetworkIDToHRP:object = {
  1: "avax",
  2: "cascade",
  3: "denali",
  4: "everest",
  12345: "local"
};
  
export const HRPToNetworkID:object = {
  "avax": 1,
  "cascade": 2,
  "denali": 3,
  "everest": 4,
  "local": 12345
};

export const NetworkIDToNetworkNames:object = {
  1: ["Avalanche","Mainnet"],
  2: ["Cascade"],
  3: ["Denali"],
  4: ["Everest", "Testnet"],
  12345: ["Local Network"]
};

export const NetworkNameToNetworkID:object = {
  "Avalanche": 1,
  "Mainnet": 1,
  "Cascade": 2,
  "Denali": 3,
  "Everest": 4,
  "Testnet": 4,
  "Local Network": 12345
};

export const FallbackHRP:string = "custom";
export const FallbackNetworkName:string = "Custom Network";

export const DefaultNetworkID:number = 4;

export const PlatformChainID:string = "11111111111111111111111111111111LpoYY";
export const PrimaryNetworkID:string = "11111111111111111111111111111111LpoYY";
export const XChainAlias:string = "X";
export const CChainAlias:string = "C";
export const PChainAlias:string = "P";
export const XChainVMName:string = "avm";
export const CChainVMName:string = "evm";
export const PChainVMName:string = "platformvm";

export const ONEAVAX:BN = new BN(1000000000);

export const DECIAVAX:BN = ONEAVAX.div(new BN(10));

export const CENTIAVAX:BN = ONEAVAX.div(new BN(100));

export const MILLIAVAX:BN = ONEAVAX.div(new BN(1000));

export const MICROAVAX:BN = ONEAVAX.div(new BN(1000000));

export const NANOAVAX:BN = ONEAVAX.div(new BN(1000000000));

export const WEI:BN = new BN(1);

export const GWEI:BN = WEI.mul(new BN(1000000000));

export const AVAXGWEI:BN = NANOAVAX.clone();

// TODO: UPDATE FOR MAINNET

const n1X:object = {
  blockchainID: '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 1000000
};

const n1P:object = {
  blockchainID: PlatformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 1000000,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAVAX),
  minStake: ONEAVAX.mul(new BN(2000))
};

const n1C:object = {
  blockchainID: '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 470000000000000
};

// END TODO

const n2X:object = {
  blockchainID: '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n2P:object = {
  blockchainID: PlatformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAVAX),
  minStake: ONEAVAX.mul(new BN(2000))
};

const n2C:object = {
  blockchainID: '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

const n3X:object = {
  blockchainID: 'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n3P:object = {
  blockchainID: '',
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAVAX),
  minStake: ONEAVAX.mul(new BN(2000))
};

const n3C:object = {
  blockchainID: 'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

// TODO: UPDATE FOR EVEREST
const n4X:object = {
  blockchainID: 'jnUjZSRt16TcRnZzmh5aMhavwVHz3zBrSN8GfFMTQkzUnoBxC',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 1000000
};

const n4P:object = {
  blockchainID: PlatformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 1000000,
  minConsumption: 0.1,
  maxConsumption: 0.12,
  maxStakingDuration: new BN(31536000),
  maxSupply: new BN(720000000).mul(ONEAVAX),
  minStake: ONEAVAX.mul(new BN(2000))
};

const n4C:object = {
  blockchainID: 'saMG5YgNsFxzjz4NMkEkt3bAH6hVxWdZkWcEnGB3Z15pcAmsK',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 470000000000000
};

// END TODO

const n12345X:any = { ...n4X };
n12345X.blockchainID = 'v4hFSZTNNVdyomeMoXa77dAz4CdxU3cziSb45TB7mfXUmy7C7';
const n12345P:any = { ...n4P };
n12345P.blockchainID = PlatformChainID;
const n12345C:any = { ...n4C };
n12345C.blockchainID = '2m6aMgMBJWsmT4Hv448n6sNAwGMFfugBvdU6PdY5oxZge4qb1W';

export class Defaults {
  static network = {
    1: { // update before mainnet
      hrp: NetworkIDToHRP[1],
      X: n1X,
      '2VvmkRw4yrz8tPrVnCCbvEK1JxNyujpqhmU6SGonxMpkWBx9UD': n1X,
      P: n1P,
      '11111111111111111111111111111111LpoYY': n1P,
      C: n1C,
      '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i': n1C,
    }, 
    2: {
      hrp: NetworkIDToHRP[2],
      X: n2X,
      '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM': n2X,
      P: n2P,
      '11111111111111111111111111111111LpoYY': n2P,
      C: n2C,
      '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i': n2C,
    },
    3: {
      hrp: NetworkIDToHRP[3],
      X: n3X,
      'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L': n3X,
      P: n3P,
      '11111111111111111111111111111111LpoYY': n3P,
      C: n3C,
      'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9': n3C,
    },
    4: { // update before everest
      hrp: NetworkIDToHRP[4],
      X: n4X,
      'jnUjZSRt16TcRnZzmh5aMhavwVHz3zBrSN8GfFMTQkzUnoBxC': n4X,
      P: n4P,
      '11111111111111111111111111111111LpoYY': n4P,
      C: n4C,
      'saMG5YgNsFxzjz4NMkEkt3bAH6hVxWdZkWcEnGB3Z15pcAmsK': n4C,
    },
    12345: {
      hrp: NetworkIDToHRP[12345],
      X: n12345X,
      'v4hFSZTNNVdyomeMoXa77dAz4CdxU3cziSb45TB7mfXUmy7C7': n12345X,
      P: n12345P,
      '11111111111111111111111111111111LpoYY': n12345P,
      C: n12345C,
      '2m6aMgMBJWsmT4Hv448n6sNAwGMFfugBvdU6PdY5oxZge4qb1W': n12345C,
    },
  };
}

/**
 * Rules used when merging sets
 */
export type MergeRule = 'intersection' // Self INTERSECT New
| 'differenceSelf' // Self MINUS New
| 'differenceNew' // New MINUS Self
| 'symDifference' // differenceSelf UNION differenceNew
| 'union' // Self UNION New
| 'unionMinusNew' // union MINUS differenceNew
| 'unionMinusSelf' // union MINUS differenceSelf
| 'ERROR'; // generate error for testing
