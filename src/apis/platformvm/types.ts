/**
 * @packageDocumentation
 * @module PVMAPI-Types
 */

import BN from 'bn.js';

export class PlatformVMConstants {
  static ONEAVAX:BN = new BN(1000000000);

  static DECIAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(10));

  static CENTIAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(100));

  static MILLIAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(1000));

  static MICROAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(1000000));

  static SECPFXID:number = 0;

  static NFTFXID:number = 1;

  static SECPOUTPUTID:number = 7;

  static NFTXFEROUTPUTID:number = 11;

  static NFTMINTOUTPUTID:number = 10;

  static SECPINPUTID:number = 5;

  static NFTMINTOPID:number = 12;

  static NFTXFEROP:number = 13;

  static BASETX:number = 0;

  static CREATEASSETTX:number = 1;

  static OPERATIONTX:number = 2;

  static IMPORTTX:number = 3;

  static EXPORTTX:number = 4;

  static SECPCREDENTIAL:number = 9;

  static NFTCREDENTIAL:number = 14;

  static ASSETIDLEN:number = 32;

  static BLOCKCHAINIDLEN:number = 32;

  static SYMBOLMAXLEN:number = 4;

  static ASSETNAMELEN:number = 128;

  static ADDRESSLENGTH:number = 20;
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

/**
 * Function providing the current UNIX time using a {@link https://github.com/indutny/bn.js/|BN}
 */
export function UnixNow():BN {
  return new BN(Math.round((new Date()).getTime() / 1000));
}
