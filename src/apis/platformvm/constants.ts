/**
 * @packageDocumentation
 * @module API-PlatformVM-Constants
 */

export class PlatformVMConstants {
  static LATESTCODEC: number = 0

  static SECPFXID: number = 0

  static SECPXFEROUTPUTID: number = 7

  static SUBNETAUTHID: number = 10

  static SECPOWNEROUTPUTID: number = 11

  static STAKEABLELOCKOUTID: number = 22

  static SECPINPUTID: number = 5

  static STAKEABLELOCKINID: number = 21

  static BASETX: number = 0

  static SUBNETAUTH: number = 10

  static ADDVALIDATORTX: number = 12

  static ADDSUBNETVALIDATORTX: number = 13

  static ADDDELEGATORTX: number = 14

  static CREATECHAINTX: number = 15

  static CREATESUBNETTX: number = 16

  static IMPORTTX: number = 17

  static EXPORTTX: number = 18

  static ADVANCETIMETX: number = 19

  static REWARDVALIDATORTX: number = 20

  static SECPCREDENTIAL: number = 9

  // Camino
  static CUSTOM_TYPE_ID: number = 8192
  static LOCKEDINID: number = PlatformVMConstants.CUSTOM_TYPE_ID + 0
  static LOCKEDOUTID: number = PlatformVMConstants.CUSTOM_TYPE_ID + 1
  static CAMINOADDVALIDATORTX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 2
  static CAMINOREWARDVALIDATORTX: number =
    PlatformVMConstants.CUSTOM_TYPE_ID + 3
  static ADDRESSSTATETX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 4
  static DEPOSITTX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 5
  static UNLOCKDEPOSITTX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 6
  static REGISTERNODETX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 7
  // static BASETX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 8
  static MULTISIGALIASTX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 9
  static CLAIMTX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 10
  static REWARDSIMPORTTX: number = PlatformVMConstants.CUSTOM_TYPE_ID + 11
  static SECPMULTISIGCREDENTIAL: number =
    PlatformVMConstants.CUSTOM_TYPE_ID + 12

  // Length Constants
  static ASSETIDLEN: number = 32

  static BLOCKCHAINIDLEN: number = 32

  static SYMBOLMAXLEN: number = 4

  static ASSETNAMELEN: number = 128

  static ADDRESSLENGTH: number = 20
}
