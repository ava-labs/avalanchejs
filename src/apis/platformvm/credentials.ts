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
    const secpcred:SECPCredential = new SECPCredential(...args);
    return secpcred;
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectCredentialClass: unknown credid ${credid}`);
};

export class SECPCredential extends Credential {
  protected type = "SECPCredential";
  protected typeID = PlatformVMConstants.SECPCREDENTIAL;

  getCredentialID():number {
    return this.typeID;
  }

  getFields(encoding:string = "hex"):object {};
  setFields(fields:object, encoding:string = "hex") {

  }

  deserialize(obj:object, encoding:string = "hex"):this {

  };

  serialize(encoding:string = "hex"):string {

  };

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

