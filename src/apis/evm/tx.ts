/**
 * @packageDocumentation
 * @module API-EVM-Transactions
 */

import { Buffer } from 'buffer/';

export abstract class Tx {
  protected typeid: Buffer = Buffer.alloc(4); 
  protected networkid: Buffer = Buffer.alloc(4); 
  protected blockchainid: Buffer = Buffer.alloc(32);

  /**
   * Returns the typeid of the input as {@link https://github.com/feross/buffer|Buffer}
   */
  getTypeID = (): Buffer => this.typeid;

  /**
   * Returns the networkid as a {@link https://github.com/feross/buffer|Buffer}.
   */
  getNetworkID = (): Buffer => this.networkid;

  /**
   * Returns the blockchainid of the input as {@link https://github.com/feross/buffer|Buffer}
   */ 
  getBlockchainID = (): Buffer => this.blockchainid;

  /**
   * Class representing a Tx.
   *
   * @param networkid Optional networkid
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   */
  constructor(networkid: number = undefined, blockchainid: Buffer = Buffer.alloc(32, 16)) {
    this.networkid.writeUInt32BE(networkid, 0);
    this.blockchainid = blockchainid;
  }
}
