/**
 * @packageDocumentation
 * @module API-PlatformVM-Credentials
 */
import BinTools from '../../utils/bintools';

import { PlatformVMConstants } from './constants';
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
  if (credid === PlatformVMConstants.SECPCREDENTIAL) {
    const secpcred:SecpCredential = new SecpCredential(...args);
    return secpcred;
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectCredentialClass: unknown credid ${credid}`);
};

export class SecpCredential extends Credential {
  getCredentialID():number {
    return PlatformVMConstants.SECPCREDENTIAL;
  }
}

