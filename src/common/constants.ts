/**
 * @packageDocumentation
 * @module Common-Constants
 */

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

export const FallbackHRP:string = "custom";

export const DefaultNetworkID:number = 3;


// TODO: UPDATE FOR MAINNET

export const platformChainID:string = "11111111111111111111111111111111LpoYY";
export const XChainAlias:string = "X";
export const CChainAlias:string = "C";
export const PChainAlias:string = "P";
export const XChainVMName:string = "avm";
export const CChainVMName:string = "evm";
export const PChainVMName:string = "platformvm";

const n1X:object = {
  blockchainID: '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n1P:object = {
  blockchainID: platformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0
};

const n1C:object = {
  blockchainID: '2mUYSXfLrDtigwbzj1LxKVsHwELghc5sisoXrzJwLqAAQHF4i',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

// END TODO

const n2X:object = {
  blockchainID: '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n2P:object = {
  blockchainID: platformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0
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
  fee: 0
};

const n3C:object = {
  blockchainID: 'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

// TODO: UPDATE FOR EVEREST
const n4X:object = {
  blockchainID: 'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L',
  alias: XChainAlias,
  vm: XChainVMName,
  fee: 0
};

const n4P:object = {
  blockchainID: platformChainID,
  alias: PChainAlias,
  vm: PChainVMName,
  fee: 0
};

const n4C:object = {
  blockchainID: 'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9',
  alias: CChainAlias,
  vm: CChainVMName,
  fee: 0
};

// END TODO

const n12345X:any = { ...n2X };
n12345X.blockchainID = '4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH';
const n12345P:any = { ...n2P };
n12345P.blockchainID = platformChainID;
const n12345C:any = { ...n2C };
n12345C.blockchainID = 'jvYyfQTxGMJLuGWa55kdP2p2zSUYsQ5Raupu4TW34ZAUBAbtq';

export class Defaults {
  static network = {
    1: { // update before mainnet
      hrp: NetworkIDToHRP[1],
      X: n1X,
      '4ktRjsAKxgMr2aEzv9SWmrU7Xk5FniHUrVCX4P1TZSfTLZWFM': n1X,
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
      'rrEWX7gc7D9mwcdrdBxBTdqh1a7WDVsMuadhTZgyXfFcRz45L': n4X,
      P: n4P,
      '11111111111111111111111111111111LpoYY': n4P,
      C: n4C,
      'zJytnh96Pc8rM337bBrtMvJDbEdDNjcXG3WkTNCiLp18ergm9': n4C,
    },
    12345: {
      hrp: NetworkIDToHRP[12345],
      X: n12345X,
      '4R5p2RXDGLqaifZE4hHWH9owe34pfoBULn1DrQTWivjg8o4aH': n12345X,
      P: n12345P,
      '11111111111111111111111111111111LpoYY': n12345P,
      C: n12345C,
      'jvYyfQTxGMJLuGWa55kdP2p2zSUYsQ5Raupu4TW34ZAUBAbtq': n12345C,
    },
  };
}