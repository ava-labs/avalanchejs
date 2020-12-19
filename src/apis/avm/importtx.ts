/**
 * @packageDocumentation
 * @module API-AVM-ImportTx
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { AVMConstants } from './constants';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { BaseTx } from './basetx';
import { SelectCredentialClass } from './credentials';
import { Signature, SigIdx, Credential } from '../../common/credentials';
import { KeyChain, KeyPair } from './keychain';
import { DefaultNetworkID } from '../../utils/constants';
import { Serialization, SerializedEncoding } from '../../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Class representing an unsigned Import transaction.
 */
export class ImportTx extends BaseTx {
  protected _typeName = "ImportTx";
  protected _typeID = AVMConstants.IMPORTTX;

  serialize(encoding:SerializedEncoding = "hex"):object {
    let fields:object = super.serialize(encoding);
    return {
      ...fields,
      "sourceChain": serializer.encoder(this.sourceChain, encoding, "Buffer", "cb58"),
      "importIns": this.importIns.map((i) => i.serialize(encoding))
    }
  };
  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.sourceChain = serializer.decoder(fields["sourceChain"], encoding, "cb58", "Buffer", 32);
    this.importIns = fields["importIns"].map((i:object) => {
      let ii:TransferableInput = new TransferableInput();
      ii.deserialize(i, encoding);
      return ii;
    });
    this.numIns = Buffer.alloc(4);
    this.numIns.writeUInt32BE(this.importIns.length, 0);
  }

  protected sourceChain:Buffer = Buffer.alloc(32);
  protected numIns:Buffer = Buffer.alloc(4);
  protected importIns:Array<TransferableInput> = [];

  /**
     * Returns the id of the [[ImportTx]]
     */
  getTxType = ():number => {
    return this._typeID;
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} for the source chainid.
   */
  getSourceChain = ():Buffer => {
    return this.sourceChain;
  }

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ImportTx]], parses it, populates the class, and returns the length of the [[ImportTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ImportTx]]
     *
     * @returns The length of the raw [[ImportTx]]
     *
     * @remarks assume not-checksummed
     */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    offset = super.fromBuffer(bytes, offset);
    this.sourceChain = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.numIns = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    const numIns:number = this.numIns.readUInt32BE(0);
    for (let i:number = 0; i < numIns; i++) {
      const anIn:TransferableInput = new TransferableInput();
      offset = anIn.fromBuffer(bytes, offset);
      this.importIns.push(anIn);
    }
    return offset;
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
   */
  toBuffer():Buffer {
    if(typeof this.sourceChain === "undefined") {
      throw new Error("ImportTx.toBuffer -- this.sourceChain is undefined");
    }
    this.numIns.writeUInt32BE(this.importIns.length, 0);
    let barr:Array<Buffer> = [super.toBuffer(), this.sourceChain, this.numIns];
    this.importIns = this.importIns.sort(TransferableInput.comparator());
    for(let i = 0; i < this.importIns.length; i++) {
        barr.push(this.importIns[i].toBuffer());
    }
    return Buffer.concat(barr);
  }
  /**
     * Returns an array of [[TransferableInput]]s in this transaction.
     */
  getImportInputs():Array<TransferableInput> {
    return this.importIns;
  }

  clone():this {
    let newbase:ImportTx = new ImportTx();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
      return new ImportTx(...args) as this;
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
    const sigs:Array<Credential> = super.sign(msg, kc);
    for (let i = 0; i < this.importIns.length; i++) {
      const cred:Credential = SelectCredentialClass(this.importIns[i].getInput().getCredentialID());
      const sigidxs:Array<SigIdx> = this.importIns[i].getInput().getSigIdxs();
      for (let j = 0; j < sigidxs.length; j++) {
        const keypair:KeyPair = kc.getKey(sigidxs[j].getSource());
        const signval:Buffer = keypair.sign(msg);
        const sig:Signature = new Signature();
        sig.fromBuffer(signval);
        cred.addSignature(sig);
      }
      sigs.push(cred);
    }
    return sigs;
  }

  /**
   * Class representing an unsigned Import transaction.
   *
   * @param networkid Optional networkid, [[DefaultNetworkID]]
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param sourceChain Optional chainid for the source inputs to import. Default platform chainid.
   * @param importIns Array of [[TransferableInput]]s used in the transaction
   */
  constructor(
    networkid:number = DefaultNetworkID, blockchainid:Buffer = Buffer.alloc(32, 16), 
    outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined,
    memo:Buffer = undefined, sourceChain:Buffer = undefined, importIns:Array<TransferableInput> = undefined
  ) {
    super(networkid, blockchainid, outs, ins, memo);
    this.sourceChain = sourceChain; // do not correct, if it's wrong it'll bomb on toBuffer
    if (typeof importIns !== 'undefined' && Array.isArray(importIns)) {
      for (let i = 0; i < importIns.length; i++) {
        if (!(importIns[i] instanceof TransferableInput)) {
          throw new Error("Error - ImportTx.constructor: invalid TransferableInput in array parameter 'importIns'");
        }
      }
      this.importIns = importIns;
    }
  }
}