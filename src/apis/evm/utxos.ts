
/**
 * @packageDocumentation
 * @module API-EVM-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { off } from 'process';
import { EVMOutput, SelectOutputClass } from './outputs';
import { StandardUTXOSet, AssetAmount, OutputOwners } from '../../common';
import { UnixNow, PlatformChainID } from '../../utils';
import { UTXO, AssetAmountDestination, AmountOutput, SECPTransferInput, TransferableInput, TransferableOutput, UnsignedTx, BaseTx, InitialStates, SECPMintOutput, CreateAssetTx, SECPTransferOutput, TransferableOperation, SECPMintOperation, AVMConstants, OperationTx, MinterSet, NFTMintOutput, NFTMintOperation, NFTTransferOutput, NFTTransferOperation, ImportTx, ExportTx } from '../avm';
import { Serialization, SerializedEncoding } from '../../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Class for representing a single UTXO.
 */
export class EVMUTXO {
  protected codecid: Buffer = Buffer.alloc(2);
  protected txid: Buffer = Buffer.alloc(32);
  protected outputidx: Buffer = Buffer.alloc(4);
  protected assetid: Buffer = Buffer.alloc(32);
  protected output: EVMOutput = undefined;

  /**
   * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
   *
   * @param serialized A base-58 string containing a raw [[UTXO]]
   *
   * @returns The length of the raw [[UTXO]]
   *
   * @remarks
   * unlike most fromStrings, it expects the string to be serialized in cb58 format
   */
  fromString(serialized: string): number {
    /* istanbul ignore next */
    return this.fromBuffer(bintools.cb58Decode(serialized));
  }

  /**
   * Returns a base-58 representation of the [[UTXO]].
   *
   * @remarks
   * unlike most toStrings, this returns in cb58 serialization format
   */
  toString(): string {
    /* istanbul ignore next */
    return bintools.cb58Encode(this.toBuffer());
  }

  fromBuffer(bytes: Buffer, offset: number = 0): number {
    this.codecid = bintools.copyFrom(bytes, offset, offset + 2);
    offset += 2;
    this.txid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    const outputid: number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    // this.output = SelectOutputClass(outputid);
    // return this.output.fromBuffer(bytes, offset);
    return offset;
  }

  /**
   * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[UTXO]].
    */
  toBuffer(): Buffer {
    const outbuff: Buffer = this.output.toBuffer();
    const outputidbuffer: Buffer = Buffer.alloc(4);
    // outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
    const barr: Buffer[] = [this.codecid, this.txid, this.outputidx, this.assetid, outputidbuffer, outbuff];
    return Buffer.concat(barr, 
      this.codecid.length + this.txid.length 
      + this.outputidx.length + this.assetid.length
      + outputidbuffer.length + outbuff.length);
  }
}

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet extends StandardUTXOSet<UTXO>{
  protected _typeName = "UTXOSet";
  protected _typeID = undefined;
  
  //serialize is inherited

  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    let utxos = {};
    for(let utxoid in fields["utxos"]){
      let utxoidCleaned:string = serializer.decoder(utxoid, encoding, "base58", "base58");
      utxos[utxoidCleaned] = new UTXO();
      utxos[utxoidCleaned].deserialize(fields["utxos"][utxoid], encoding);
    }
    let addressUTXOs = {};
    for(let address in fields["addressUTXOs"]){
      let addressCleaned:string = serializer.decoder(address, encoding, "cb58", "hex");
      let utxobalance = {};
      for(let utxoid in fields["addressUTXOs"][address]){
        let utxoidCleaned:string = serializer.decoder(utxoid, encoding, "base58", "base58");
        utxobalance[utxoidCleaned] = serializer.decoder(fields["addressUTXOs"][address][utxoid], encoding, "decimalString", "BN");
      }
      addressUTXOs[addressCleaned] = utxobalance;
    }
    this.utxos = utxos;
    this.addressUTXOs = addressUTXOs;
  }

  parseUTXO(utxo:UTXO | string):UTXO {
    const utxovar:UTXO = new UTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxovar.fromBuffer(bintools.cb58Decode(utxo));
    } else if (utxo instanceof UTXO) {
      utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
    } else {
      /* istanbul ignore next */
      throw new Error(`Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string: ${utxo}`);
    }
    return utxovar
  }

  create(...args:any[]):this{
    return new UTXOSet() as this;
  }

  clone():this {
    const newset:UTXOSet = this.create();
    const allUTXOs:Array<UTXO> = this.getAllUTXOs();
    newset.addArray(allUTXOs)
    return newset as this;
  }

  _feeCheck(fee:BN, feeAssetID:Buffer):boolean {
    return (typeof fee !== "undefined" && 
    typeof feeAssetID !== "undefined" &&
    fee.gt(new BN(0)) && feeAssetID instanceof Buffer);
  }

  getMinimumSpendable = (aad:AssetAmountDestination, asOf:BN = UnixNow(), locktime:BN = new BN(0), threshold:number = 1):Error => {
    // const utxoArray:Array<UTXO> = this.getAllUTXOs();
    // const outids:object = {};
    // for(let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
    //   const u:UTXO = utxoArray[i];
    //   const assetKey:string = u.getAssetID().toString("hex");
    //   const fromAddresses:Array<Buffer> = aad.getSenders();
    //   if(u.getOutput() instanceof AmountOutput && aad.assetExists(assetKey) && u.getOutput().meetsThreshold(fromAddresses, asOf)) {
    //     const am:AssetAmount = aad.getAssetAmount(assetKey);
    //     if(!am.isFinished()){
    //       const uout:AmountOutput = u.getOutput() as AmountOutput;
    //       outids[assetKey] = uout.getOutputID();
    //       const amount = uout.getAmount();
    //       am.spendAmount(amount);
    //       const txid:Buffer = u.getTxID();
    //       const outputidx:Buffer = u.getOutputIdx();
    //       const input:SECPTransferInput = new SECPTransferInput(amount);
    //       const xferin:TransferableInput = new TransferableInput(txid, outputidx, u.getAssetID(), input);
    //       const spenders:Array<Buffer> = uout.getSpenders(fromAddresses, asOf);
    //       for (let j = 0; j < spenders.length; j++) {
    //         const idx:number = uout.getAddressIdx(spenders[j]);
    //         if (idx === -1) {
    //           /* istanbul ignore next */
    //           throw new Error('Error - UTXOSet.getMinimumSpendable: no such '
    //           + `address in output: ${spenders[j]}`);
    //         }
    //         xferin.getInput().addSignatureIdx(idx, spenders[j]);
    //       }
    //       aad.addInput(xferin);
    //     } else if(aad.assetExists(assetKey) && !(u.getOutput() instanceof AmountOutput)){
    //       /**
    //        * Leaving the below lines, not simply for posterity, but for clarification.
    //        * AssetIDs may have mixed OutputTypes. 
    //        * Some of those OutputTypes may implement AmountOutput.
    //        * Others may not.
    //        * Simply continue in this condition.
    //        */
    //       /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
    //         + `implement AmountOutput: ${u.getOutput().getOutputID}`);*/
    //         continue;
    //     }
    //   }
    // }
    // if(!aad.canComplete()) {
    //   return new Error('Error - UTXOSet.getMinimumSpendable: insufficient '
    //   + 'funds to create the transaction');
    // }
    // const amounts:Array<AssetAmount> = aad.getAmounts();
    // const zero:BN = new BN(0);
    // for(let i = 0; i < amounts.length; i++) {
    //   const assetKey:string = amounts[i].getAssetIDString();
    //   const amount:BN = amounts[i].getAmount();
    //   if (amount.gt(zero)) {
    //     const spendout:AmountOutput = SelectOutputClass(outids[assetKey],
    //       amount, aad.getDestinations(), locktime, threshold) as AmountOutput;
    //     const xferout:TransferableOutput = new TransferableOutput(amounts[i].getAssetID(), spendout);
    //     aad.addOutput(xferout);
    //   }
    //   const change:BN = amounts[i].getChange();
    //   if (change.gt(zero)) {
    //     const changeout:AmountOutput = SelectOutputClass(outids[assetKey],
    //       change, aad.getChangeAddresses()) as AmountOutput;
    //     const chgxferout:TransferableOutput = new TransferableOutput(amounts[i].getAssetID(), changeout);
    //     aad.addChange(chgxferout);
    //   }
    // }
    return undefined;
  }
}