/**
 * @packageDocumentation
 * @module PlatformAPI-Types
 */
import { Buffer } from 'buffer/';
import { NBytes } from '../../utils/types';

export class PlatformConstants {
    static ADDDEFAULTSUBNETDELEGATORTX:number = 15;
}

/**
 * Type representing a [[Signature]] index used in [[Input]]
 */
export class SigIdx extends NBytes {
  source:Buffer;

  /**
     * Sets the source address for the signature
     */
  setSource = (address:Buffer) => {
    this.source = address;
  };

  /**
     * Retrieves the source address for the signature
     */
  getSource = ():Buffer => this.source;

  /**
     * Type representing a [[Signature]] index used in [[Input]]
     */
  constructor() {
    super();
    this.bytes = Buffer.alloc(4);
    this.bsize = 4;
  }
}

/**
 * Signature for a [[Tx]]
 */
export class Signature extends NBytes {
  /**
     * Signature for a [[Tx]]
     */
  constructor() {
    super();
    this.bytes = Buffer.alloc(65);
    this.bsize = 65;
  }
}