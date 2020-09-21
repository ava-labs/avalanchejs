/**
 * @packageDocumentation
 * @module Utils-HelperFunctions
 */

import { NetworkIDToHRP, DefaultNetworkID, FallbackHRP } from './constants';
import BN from 'bn.js';
import { Buffer } from 'buffer/';
import BinTools from '../utils/bintools';

/**
 * @ignore
 */
const bintools:BinTools = BinTools.getInstance();

export function getPreferredHRP(networkID:number = undefined) {
    if (networkID in NetworkIDToHRP) {
      return NetworkIDToHRP[networkID];
    } else if(typeof networkID === "undefined") {
      return NetworkIDToHRP[DefaultNetworkID];
    }
    return FallbackHRP;
}

export function MaxWeightFormula(staked:BN, cap:BN):BN{
  return BN.min(staked.mul(new BN(5)), cap);
}

/**
 * Function providing the current UNIX time using a {@link https://github.com/indutny/bn.js/|BN}.
 */
export function UnixNow():BN {
  return new BN(Math.round((new Date()).getTime() / 1000));
}

/**
 * Takes a private key buffer and produces a private key string with prefix.
 * 
 * @param pk A {@link https://github.com/feross/buffer|Buffer} for the private key.
 */
export function bufferToPrivateKeyString(pk:Buffer):string {
  return "PrivateKey-" + bintools.cb58Encode(pk);
}

/**
 * Takes a private key string and produces a private key {@link https://github.com/feross/buffer|Buffer}.
 * 
 * @param pk A string for the private key.
 */
export function privateKeyStringToBuffer(pk:string):Buffer {
  if(!pk.startsWith("PrivateKey-")) {
    throw new Error("Error - privateKeyStringToBuffer: private keys must start with 'PrivateKey-'");
  }
  let pksplit:Array<string> = pk.split("-");
  return bintools.cb58Decode(pksplit[pksplit.length - 1]);
}

/**
 * Takes a nodeID buffer and produces a nodeID string with prefix.
 * 
 * @param pk A {@link https://github.com/feross/buffer|Buffer} for the nodeID.
 */
export function bufferToNodeIDString(pk:Buffer):string {
  return "NodeID-" + bintools.cb58Encode(pk);
}

/**
 * Takes a nodeID string and produces a nodeID {@link https://github.com/feross/buffer|Buffer}.
 * 
 * @param pk A string for the nodeID.
 */
export function NodeIDStringToBuffer(pk:string):Buffer {
  if(!pk.startsWith("NodeID-")) {
    throw new Error("Error - privateNodeIDToBuffer: nodeID must start with 'NodeID-'");
  }
  let pksplit:Array<string> = pk.split("-");
  return bintools.cb58Decode(pksplit[pksplit.length - 1]);
}