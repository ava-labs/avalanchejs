/**
 * @packageDocumentation
 * @module API-AVM-Credentials
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
    const secpcred:SECPCredential = new SECPCredential(...args);
    return secpcred;
  } if (credid === AVMConstants.NFTCREDENTIAL) {
    const nftcred:NFTCredential = new NFTCredential(...args);
    return nftcred;
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectCredentialClass: unknown credid ${credid}`);
};

export class SECPCredential extends Credential {
  getCredentialID():number {
    return AVMConstants.SECPCREDENTIAL;
  }

  clone():this {
    let newbase:SECPCredential = new SECPCredential();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
    return new SECPCredential(...args) as this;
  }

  select(id:number, ...args:any[]):this {
    let newbasetx:SECPCredential = SelectCredentialClass(id, ...args);
    return newbasetx as this;
  }

}

export class NFTCredential extends Credential {
  getCredentialID():number {
    return AVMConstants.NFTCREDENTIAL;
  }

  clone():this {
    let newbase:NFTCredential = new NFTCredential();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
    return new NFTCredential(...args) as this;
  }

  select(id:number, ...args:any[]):this {
    let newbasetx:NFTCredential = SelectCredentialClass(id, ...args);
    return newbasetx as this;
  }

}
