/**
 * @packageDocumentation
 * @module AVMAPI-Credentials
 */
import BinTools from '../../utils/bintools';

import { AVMConstants } from './constants';
import { Signature, Credential } from '../../common/credentials';
Signature

/**
 * @ignore
 */
const bintools:BinTools = BinTools.getInstance();

/**
 * Takes a buffer representing the credential and returns the proper [[Credential]] instance.
 *
 * @param credid A number representing the credential ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Credential]]-extended class.
 */
export const SelectCredentialClass = (credid:number, ...args:Array<any>):Credential => {
  if (credid === AVMConstants.SECPCREDENTIAL) {
    const secpcred:SecpCredential = new SecpCredential(...args);
    return secpcred;
  } if (credid === AVMConstants.NFTCREDENTIAL) {
    const nftcred:NFTCredential = new NFTCredential(...args);
    return nftcred;
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectCredentialClass: unknown credid ${credid}`);
};

export class SecpCredential extends Credential {
  getCredentialID():number {
    return AVMConstants.SECPCREDENTIAL;
  }
}

export class NFTCredential extends Credential {
  getCredentialID():number {
    return AVMConstants.NFTCREDENTIAL;
  }
}
