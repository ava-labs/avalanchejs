/**
 * @packageDocumentation
 * @module Utils-HelperFunctions
 */

import { NetworkIDToHRP, DefaultNetworkID, FallbackHRP } from './constants';
import BN from 'bn.js';


export function getPreferredHRP(networkID:number = undefined) {
    if (networkID in NetworkIDToHRP) {
      return NetworkIDToHRP[networkID];
    } else if(typeof networkID === "undefined") {
      return DefaultNetworkID;
    }
    return FallbackHRP;
}

/**
 * Function providing the current UNIX time using a {@link https://github.com/indutny/bn.js/|BN}
 */
export function UnixNow():BN {
    return new BN(Math.round((new Date()).getTime() / 1000));
}