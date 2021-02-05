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
  if (credid === AVMConstants.SECPCREDENTIAL || credid === AVMConstants.SECPCREDENTIAL_CODECONE) {
    return new SECPCredential(...args);
  } if (credid === AVMConstants.NFTCREDENTIAL || credid === AVMConstants.NFTCREDENTIAL_CODECONE) {
    return new NFTCredential(...args);
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectCredentialClass: unknown credid ${credid}`);
};

export class SECPCredential extends Credential {
  protected _typeName = "SECPCredential";
  protected _codecID = AVMConstants.LATESTCODEC;
  protected _typeID = this._codecID === 0 ? AVMConstants.SECPCREDENTIAL : AVMConstants.SECPCREDENTIAL_CODECONE;

  //serialize and deserialize both are inherited

  setCodecID(codecID: number): void {
    if(codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
        throw new Error(`Error - SECPCredential.setCodecID: codecID ${codecID}, is not valid. Valid codecIDs are 0 and 1.`);
    }
    this._codecID = codecID;
    this._typeID = this._codecID === 0 ? AVMConstants.SECPCREDENTIAL : AVMConstants.SECPCREDENTIAL_CODECONE;
  }

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
  protected _codecID = AVMConstants.LATESTCODEC;
  protected _typeID = this._codecID === 0 ? AVMConstants.NFTCREDENTIAL : AVMConstants.NFTCREDENTIAL_CODECONE;

  //serialize and deserialize both are inherited

  setCodecID(codecID: number): void {
    if(codecID !== 0 && codecID !== 1) {
      /* istanbul ignore next */
        throw new Error(`Error - NFTCredential.setCodecID: codecID ${codecID}, is not valid. Valid codecIDs are 0 and 1.`);
    }
    this._codecID = codecID;
    this._typeID = this._codecID === 0 ? AVMConstants.NFTCREDENTIAL : AVMConstants.NFTCREDENTIAL_CODECONE;
  }

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
