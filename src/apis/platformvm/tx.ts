/**
 * @packageDocumentation
 * @module API-AVM-Transactions
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import {  PlatformVMConstants } from './constants';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { SelectCredentialClass } from './credentials';
import { PlatformVMKeyChain, PlatformVMKeyPair } from './keychain';
import { StandardBaseTx, StandardTx, StandardUnsignedTx } from '../../common/tx';
import { Signature, SigIdx, Credential } from '../../common/credentials';
import createHash from 'create-hash';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Class representing a base for all transactions.
 */
export class BaseTx  extends StandardBaseTx<PlatformVMKeyPair, PlatformVMKeyChain>{
  /**
   * Returns the id of the [[BaseTx]]
   */
  getTxType = ():number => {
    return PlatformVMConstants.BASETX;
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
    this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    const outcount:number = this.numouts.readUInt32BE(0);
    this.outs = [];
    for (let i = 0; i < outcount; i++) {
      const xferout:TransferableOutput = new TransferableOutput();
      offset = xferout.fromBuffer(bytes, offset);
      this.outs.push(xferout);
    }

    this.numins = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    const incount:number = this.numins.readUInt32BE(0);
    this.ins = [];
    for (let i = 0; i < incount; i++) {
      const xferin:TransferableInput = new TransferableInput();
      offset = xferin.fromBuffer(bytes, offset);
      this.ins.push(xferin);
    }
    let memolen:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.memo = bintools.copyFrom(bytes, offset, offset + memolen);
    offset += memolen;
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
    sign(msg:Buffer, kc:PlatformVMKeyChain):Array<Credential> {
      const sigs:Array<Credential> = [];
      for (let i = 0; i < this.ins.length; i++) {
        const cred:Credential = SelectCredentialClass(this.ins[i].getInput().getCredentialID());
        const sigidxs:Array<SigIdx> = this.ins[i].getInput().getSigIdxs();
        for (let j = 0; j < sigidxs.length; j++) {
          const keypair:PlatformVMKeyPair = kc.getKey(sigidxs[j].getSource());
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
   * Class representing a BaseTx which is the foundation for all transactions.
   *
   * @param networkid Optional networkid, default 3
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   */
  constructor(networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16), outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined, memo:Buffer = undefined) {
    super(networkid, blockchainid, outs, ins, memo);
  }
}


/**
 * Class representing an unsigned Import transaction.
 */
export class ImportTx extends BaseTx {
  protected numIns:Buffer = Buffer.alloc(4);
  protected importIns:Array<TransferableInput> = [];

  /**
     * Returns the id of the [[ImportTx]]
     */
  getTxType = ():number => {
    return PlatformVMConstants.IMPORTTX;
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
  fromBuffer(bytes:Buffer, offset:number = 0, codecid:number = PlatformVMConstants.LATESTCODEC):number {
    offset = super.fromBuffer(bytes, offset);
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
      this.numIns.writeUInt32BE(this.importIns.length, 0);
      let barr:Array<Buffer> = [super.toBuffer(), this.numIns];
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

  /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[PlatformVMKeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
  sign(msg:Buffer, kc:PlatformVMKeyChain):Array<Credential> {
    const sigs:Array<Credential> = super.sign(msg, kc);
    for (let i = 0; i < this.importIns.length; i++) {
      const cred:Credential = SelectCredentialClass(this.importIns[i].getInput().getCredentialID());
      const sigidxs:Array<SigIdx> = this.importIns[i].getInput().getSigIdxs();
      for (let j = 0; j < sigidxs.length; j++) {
        const keypair:PlatformVMKeyPair = kc.getKey(sigidxs[j].getSource());
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
   * @param networkid Optional networkid, default 3
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param importIns Array of [[TransferableInput]]s used in the transaction
   */
  constructor(
    networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16),
    outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined,
    memo:Buffer = undefined, importIns:Array<TransferableInput> = undefined
  ) {
    super(networkid, blockchainid, outs, ins, memo);
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

/**
 * Class representing an unsigned Export transaction.
 */
export class ExportTx extends BaseTx {
  protected numOuts:Buffer = Buffer.alloc(4);
  protected exportOuts:Array<TransferableOutput> = [];

  /**
     * Returns the id of the [[ExportTx]]
     */
  getTxType = ():number => {
    return PlatformVMConstants.EXPORTTX;
  }

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[ExportTx]], parses it, populates the class, and returns the length of the [[ExportTx]] in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[ExportTx]]
     *
     * @returns The length of the raw [[ExportTx]]
     *
     * @remarks assume not-checksummed
     */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    // this.codecid.writeUInt8(offset, 0);
    // offset += 6;
    offset = super.fromBuffer(bytes, offset);
    this.numOuts = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    const numOuts:number = this.numOuts.readUInt32BE(0);
    for (let i:number = 0; i < numOuts; i++) {
      const anOut:TransferableOutput = new TransferableOutput();
      offset = anOut.fromBuffer(bytes, offset);
      this.exportOuts.push(anOut);
    }
    return offset;
  }

  /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ExportTx]].
     */
  toBuffer():Buffer {
      this.numOuts.writeUInt32BE(this.exportOuts.length, 0);
      let barr:Array<Buffer> = [super.toBuffer(), this.numOuts];
      this.exportOuts = this.exportOuts.sort(TransferableOutput.comparator());
      for(let i = 0; i < this.exportOuts.length; i++) {
          barr.push(this.exportOuts[i].toBuffer());
      }
      return Buffer.concat(barr);
  }
  /**
     * Returns an array of [[TransferableOutput]]s in this transaction.
     */
  getExportOutputs():Array<TransferableOutput> {
    return this.exportOuts;
  }

  /**
     * Class representing an unsigned Export transaction.
     *
     * @param networkid Optional networkid, default 3
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param exportOuts Array of [[TransferableOutputs]]s used in the transaction
     */
  constructor(
    networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16),
    outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined,
    memo:Buffer = undefined, exportOuts:Array<TransferableOutput> = undefined
  ) {
    super(networkid, blockchainid, outs, ins, memo);
    if (typeof exportOuts !== 'undefined' && Array.isArray(exportOuts)) {
      for (let i = 0; i < exportOuts.length; i++) {
        if (!(exportOuts[i] instanceof TransferableOutput)) {
          throw new Error("Error - ExportTx.constructor: invalid TransferableOutput in array parameter 'exportOuts'");
        }
      }
      this.exportOuts = exportOuts;
    }
  }
}

export class UnsignedTx extends StandardUnsignedTx<PlatformVMKeyPair, PlatformVMKeyChain, BaseTx> {

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.codecid = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
    offset += 2;
    const txtype:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.transaction = SelectTxClass(txtype);
    return this.transaction.fromBuffer(bytes, offset);
  }
  
  /**
   * Signs this [[UnsignedTx]] and returns signed [[StandardTx]]
   *
   * @param kc An [[KeyChain]] used in signing
   *
   * @returns A signed [[StandardTx]]
   */
  sign(kc:PlatformVMKeyChain):StandardTx<PlatformVMKeyPair, PlatformVMKeyChain, UnsignedTx> {
    const txbuff = this.toBuffer();
    const msg:Buffer = Buffer.from(createHash('sha256').update(txbuff).digest());
    const sigs:Array<Credential> = this.transaction.sign(msg, kc);
    return new Tx(this, sigs);
  }
}

export class Tx extends StandardTx<PlatformVMKeyPair, PlatformVMKeyChain, UnsignedTx> {
  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Tx]]
   * @param offset A number representing the starting point of the bytes to begin parsing
   *
   * @returns The length of the raw [[Tx]]
   */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.unsignedTx = new UnsignedTx();
    offset = this.unsignedTx.fromBuffer(bytes, offset);
    const numcreds:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.credentials = [];
    for (let i = 0; i < numcreds; i++) {
      const credid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
      offset += 4;
      const cred:Credential = SelectCredentialClass(credid);
      offset = cred.fromBuffer(bytes, offset);
      this.credentials.push(cred);
    }
    return offset;
  }
}

/**
 * Takes a buffer representing the output and returns the proper [[BaseTx]] instance.
 *
 * @param txtype The id of the transaction type
 *
 * @returns An instance of an [[BaseTx]]-extended class.
 */
export const SelectTxClass = (txtype:number, ...args:Array<any>):BaseTx => {
  if (txtype === PlatformVMConstants.BASETX) {
    const tx:BaseTx = new BaseTx(...args);
    return tx;
  } else if (txtype === PlatformVMConstants.IMPORTTX) {
    const tx:ImportTx = new ImportTx(...args);
    return tx;
  } else if (txtype === PlatformVMConstants.EXPORTTX) {
    const tx:ExportTx = new ExportTx(...args);
    return tx;
  }
  /* istanbul ignore next */
  throw new Error(`Error - SelectTxClass: unknown txtype ${txtype}`);
};
