/**
 * @packageDocumentation
 * @module AVMAPI-Credentials
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';

import { Signature, AVMConstants } from './types';

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

export abstract class Credential {
  protected sigArray:Array<Signature> = [];

  abstract getCredentialID():number;

  /**
     * Adds a signature to the credentials and returns the index off the added signature.
     */
  addSignature = (sig:Signature):number => {
    this.sigArray.push(sig);
    return this.sigArray.length - 1;
  };

  fromBuffer(bytes, offset:number = 0):number {
    const siglen:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.sigArray = [];
    for (let i:number = 0; i < siglen; i++) {
      const sig:Signature = new Signature();
      offset = sig.fromBuffer(bytes, offset);
      this.sigArray.push(sig);
    }
    return offset;
  }

  toBuffer():Buffer {
    const siglen:Buffer = Buffer.alloc(4);
    siglen.writeInt32BE(this.sigArray.length, 0);
    const barr:Array<Buffer> = [siglen];
    let bsize:number = siglen.length;
    for (let i:number = 0; i < this.sigArray.length; i++) {
      const sigbuff:Buffer = this.sigArray[i].toBuffer();
      bsize += sigbuff.length;
      barr.push(sigbuff);
    }
    return Buffer.concat(barr, bsize);
  }

  constructor(sigarray:Array<Signature> = undefined) {
    if (typeof sigarray !== 'undefined') {
      /* istanbul ignore next */
      this.sigArray = sigarray;
    }
  }
}

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
