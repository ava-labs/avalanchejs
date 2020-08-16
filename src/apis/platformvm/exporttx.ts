/**
 * @packageDocumentation
 * @module API-PlatformVM-ExportTx
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import {  PlatformVMConstants } from './constants';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { BaseTx } from './basetx';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

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