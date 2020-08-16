/**
 * @packageDocumentation
 * @module API-AVM-ImportTx
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import {  AVMConstants } from './constants';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { BaseTx } from './basetx';
import { SelectCredentialClass } from './credentials';
import { Signature, SigIdx, Credential } from '../../common/credentials';
import { AVMKeyChain, AVMKeyPair } from './keychain';
import { platformChainID } from '../../common/constants';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();



/**
 * Class representing an unsigned Import transaction.
 */
export class ImportTx extends BaseTx {
    protected sourceChain:Buffer = Buffer.alloc(32);
    protected numIns:Buffer = Buffer.alloc(4);
    protected importIns:Array<TransferableInput> = [];
  
    /**
       * Returns the id of the [[ImportTx]]
       */
    getTxType = ():number => {
      return AVMConstants.IMPORTTX;
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
    fromBuffer(bytes:Buffer, offset:number = 0, codecid:number = AVMConstants.LATESTCODEC):number {
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
       * @param kc An [[AVMKeyChain]] used in signing
       *
       * @returns An array of [[Credential]]s
       */
    sign(msg:Buffer, kc:AVMKeyChain):Array<Credential> {
      const sigs:Array<Credential> = super.sign(msg, kc);
      for (let i = 0; i < this.importIns.length; i++) {
        const cred:Credential = SelectCredentialClass(this.importIns[i].getInput().getCredentialID());
        const sigidxs:Array<SigIdx> = this.importIns[i].getInput().getSigIdxs();
        for (let j = 0; j < sigidxs.length; j++) {
          const keypair:AVMKeyPair = kc.getKey(sigidxs[j].getSource());
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
     * @param sourceChain Optiona chainid for the source inputs to import. Default platform chainid.
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param importIns Array of [[TransferableInput]]s used in the transaction
     */
    constructor(
      networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16), sourceChain:Buffer = undefined,
      outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined,
      memo:Buffer = undefined, importIns:Array<TransferableInput> = undefined
    ) {
      super(networkid, blockchainid, outs, ins, memo);
      if(typeof sourceChain === "undefined"){
        this.sourceChain = bintools.cb58Decode(platformChainID);
      }
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