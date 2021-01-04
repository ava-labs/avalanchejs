/**
 * @packageDocumentation
 * @module API-AVM-Constants
 */

export class AVMConstants {
  static GROUPZERO: number = 0;

  static GROUPONE: number = 1;

  static GROUPTWO: number = 2;

  static GROUPTHREE: number = 3;

  static CODECZERO: number = 0;

  static CODECONE: number = 1;

  static LATESTCODEC: number = AVMConstants.CODECONE;

  static SECPFXID: number = 0;

  static NFTFXID: number = 1;

  static PROPERTYFXID: number = 2;

  // start CODECZERO constants

  static SECPMINTOUTPUTID_CODECZERO: number = 6;

  static SECPXFEROUTPUTID_CODECZERO: number = 7;

  static NFTXFEROUTPUTID_CODECZERO:number = 11;

  static NFTMINTOUTPUTID_CODECZERO: number = 10;

  static SECPINPUTID_CODECZERO: number = 5;

  static SECPMINTOPID_CODECZERO: number = 8;

  static NFTMINTOPID_CODECZERO: number = 12;

  static NFTXFEROPID_CODECZERO: number = 13;

  static SECPCREDENTIAL_CODECZERO: number = 9;

  static NFTCREDENTIAL_CODECZERO: number = 14;

  // end CODECZERO constants

  // start CODECONE constants

  static SECPINPUTID_CODECONE: number = 0;

  static SECPMINTOUTPUTID_CODECONE: number = 1;

  static SECPXFEROUTPUTID_CODECONE: number = 2;

  static SECPMINTOPID_CODECONE: number = 3;

  static SECPCREDENTIAL_CODECONE: number = 4;

  static SECPMANAGEDASSETSTATUSOUTPUTID_CODECONE: number = 5;

  static SECPUPDATEMANAGEDASSETOPID_CODECONE: number = 6;

  static NFTMINTOUTPUTID_CODECONE: number = 0;

  static NFTXFEROUTPUTID_CODECONE: number = 1;

  static NFTMINTOPID_CODECONE: number = 2;

  static NFTXFEROPID_CODECONE: number = 3;

  static NFTCREDENTIAL_CODECONE: number = 4;

  static PROPERTYMINTOUTPUTID_CODECONE: number = 0;

  static PROPERTYOWNEDOUTPUTID_CODECONE: number = 1;

  static PROPERTYMINTOPID_CODECONE: number = 2;

  static PROPERTYBURNOPID_CODECONE: number = 3;

  static PROPERTYCREDENTIAL_CODECONE: number = 4;

  // end CODECONE constants

  static BASETX: number = 0;

  static CREATEASSETTX: number = 1;

  static OPERATIONTX: number = 2;

  static IMPORTTX: number = 3;

  static EXPORTTX: number = 4;

  static ASSETIDLEN: number = 32;

  static BLOCKCHAINIDLEN: number = 32;

  static SYMBOLMAXLEN: number = 4;

  static ASSETNAMELEN: number = 128;

  static ADDRESSLENGTH: number = 20;
}

