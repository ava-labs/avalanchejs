/**
 * @packageDocumentation
 * @module API-PlatformVM-Constants
 */

import BN from 'bn.js';
import { ImportTx } from '../avm/importtx';

export class PlatformVMConstants {
  static LATESTCODEC:number = 0;

  static ONEAVAX:BN = new BN(1000000000);

  static DECIAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(10));

  static CENTIAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(100));

  static MILLIAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(1000));

  static MICROAVAX:BN = PlatformVMConstants.ONEAVAX.div(new BN(1000000));

  static SECPFXID:number = 0;

  static SECPOUTPUTID:number = 7;

  static SECPINPUTID:number = 5;

  static BASETX:number = 0;

  static ADDDEFAULTSUBNETVALIDATORTX:number = 12;

  static ADDNONDEFAULTSUBNETVALIDATORTX:number = 13;

  static ADDDEFAULTSUBNETDELEGATORTX:number = 14;

  static CREATECHAINTX:number = 15;

  static CREATESUBNETTX:number = 16;

  static IMPORTTX:number = 17;

  static EXPORTTX:number = 18;

  static ADVANCETIMETX:number = 19;

  static REWARDVALIDATORTX:number = 20;

  static SECPCREDENTIAL:number = 9;

  static ASSETIDLEN:number = 32;

  static BLOCKCHAINIDLEN:number = 32;

  static SYMBOLMAXLEN:number = 4;

  static ASSETNAMELEN:number = 128;

  static ADDRESSLENGTH:number = 20;
}
