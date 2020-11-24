/**
 * @packageDocumentation
 * @module API-EVM-BaseTx
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { KeyChain, KeyPair } from './keychain';
import { EVMStandardBaseTx } from '../../common/evmtx';
import { Credential } from '../../common/credentials';
import { DefaultNetworkID } from '../../utils/constants';
import { SelectTxClass } from './tx';
import { Serialization, SerializedEncoding } from '../../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Class representing a base for all transactions.
 */
export class EVMBaseTx extends EVMStandardBaseTx<KeyPair, KeyChain>{
  protected _typeName = "BaseTx";
  protected _typeID = undefined;

  //serialize is inherited

  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
  }

  /**
   * Returns the id of the [[BaseTx]]
   */
  getTxType = ():number => {
    return this._typeID;
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
   *
   * @returns The length of the raw [[BaseTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.blockchainid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    return offset;
  }

  /**
   * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
   *
   * @param msg A Buffer for the [[UnsignedTx]]
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns An array of [[Credential]]s
   */
  sign(msg:Buffer, kc:KeyChain):Array<Credential> {
    const sigs:Array<Credential> = [];
    // for (let i = 0; i < this.ins.length; i++) {
    //   const cred:Credential = SelectCredentialClass(this.ins[i].getInput().getCredentialID());
    //   const sigidxs:Array<SigIdx> = this.ins[i].getInput().getSigIdxs();
    //   for (let j = 0; j < sigidxs.length; j++) {
    //     const keypair:KeyPair = kc.getKey(sigidxs[j].getSource());
    //     const signval:Buffer = keypair.sign(msg);
    //     const sig:Signature = new Signature();
    //     sig.fromBuffer(signval);
    //     cred.addSignature(sig);
    //   }
    //   sigs.push(cred);
    // }
    return sigs;
  }

  clone():this {
    let newbase:EVMBaseTx = new EVMBaseTx();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
    return new EVMBaseTx(...args) as this;
  }

  select(id:number, ...args:any[]):this {
    let newbasetx:EVMBaseTx = SelectTxClass(id, ...args);
    return newbasetx as this;
  }

  /**
   * Class representing an EVMBaseTx which is the foundation for all transactions.
   *
   * @param networkid Optional networkid, [[DefaultNetworkID]]
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   */
  constructor( networkid:number = DefaultNetworkID, blockchainid:Buffer = Buffer.alloc(32, 16)) {
    super(networkid, blockchainid);
  }
}