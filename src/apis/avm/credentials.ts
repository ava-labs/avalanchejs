/**
 * @packageDocumentation
 * @module API-AVM-Credentials
 */

import { AVMConstants } from './constants';
import { Credential } from '../../common/credentials';

/**
 * Takes a buffer representing the credential and returns the proper [[Credential]] instance.
 *
 * @param credid A number representing the credential ID parsed prior to the bytes passed in
 *
 * @returns An instance of an [[Credential]]-extended class.
 */
export const SelectCredentialClass = (credid:number, ...args:Array<any>):Credential => {
  if (credid === AVMConstants.SECPCREDENTIAL) {
    return new SECPCredential(...args);
  } if (credid === AVMConstants.NFTCREDENTIAL) {
    return new NFTCredential(...args);
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectCredentialClass: unknown credid ${credid}`);
};

export class SECPCredential extends Credential {
  protected _typeName = "SECPCredential";
  protected _typeID = AVMConstants.SECPCREDENTIAL;

  //serialize and deserialize both are inherited

  getCredentialID():number {
    return this._typeID;
  }

  clone():this {
    let newbase:SECPCredential = new SECPCredential();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
    return new SECPCredential(...args) as this;
  }

  select(id:number, ...args:any[]):Credential {
    let newbasetx:Credential = SelectCredentialClass(id, ...args);
    return newbasetx;
  }

}

export class NFTCredential extends Credential {
  protected _typeName = "NFTCredential";
  protected _typeID = AVMConstants.NFTCREDENTIAL;

  //serialize and deserialize both are inherited

  getCredentialID():number {
    return this._typeID;
  }

  clone():this {
    let newbase:NFTCredential = new NFTCredential();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
    return new NFTCredential(...args) as this;
  }

  select(id:number, ...args:any[]):Credential {
    let newbasetx:Credential = SelectCredentialClass(id, ...args);
    return newbasetx;
  }

}
