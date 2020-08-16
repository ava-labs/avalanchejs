/**
 * @packageDocumentation
 * @module API-AVM-Types
 */

import BN from 'bn.js';
import BinTools from '../../utils/bintools';

/**
 * @ignore
 */
const bintools:BinTools = BinTools.getInstance();

export class AVMConstants {
  static LATESTCODEC:number = 0;

  static ONEAVAX:BN = new BN(1000000000);

  static DECIAVAX:BN = AVMConstants.ONEAVAX.div(new BN(10));

  static CENTIAVAX:BN = AVMConstants.ONEAVAX.div(new BN(100));

  static MILLIAVAX:BN = AVMConstants.ONEAVAX.div(new BN(1000));

  static MICROAVAX:BN = AVMConstants.ONEAVAX.div(new BN(1000000));

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

