/**
 * @packageDocumentation
 * @module API-PlatformVM-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { AmountOutput, SelectOutputClass, TransferableOutput } from './outputs';
import { SecpInput, TransferableInput } from './inputs';
import { Output } from '../../common/output';
import { UnixNow } from '../../utils/helperfunctions';
import { StandardUTXO, StandardUTXOSet } from '../../common/utxos';
import { PlatformVMConstants } from './constants';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Class for representing a single UTXO.
 */
export class UTXO extends StandardUTXO {

  fromBuffer(bytes:Buffer, offset:number = 0):number {
    this.codecid = bintools.copyFrom(bytes, offset, offset + 2);
    offset += 2;
    this.txid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    this.outputidx = bintools.copyFrom(bytes, offset, offset + 4);
    offset += 4;
    this.assetid = bintools.copyFrom(bytes, offset, offset + 32);
    offset += 32;
    const outputid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
    offset += 4;
    this.output = SelectOutputClass(outputid);
    return this.output.fromBuffer(bytes, offset);
  }

  /**
   * Takes a base-58 string containing a [[UTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
   *
   * @param serialized A base-58 string containing a raw [[UTXO]]
   *
   * @returns The length of the raw [[UTXO]]
   *
   * @remarks
   * unlike most fromStrings, it expects the string to be serialized in cb58 format
   */
  fromString(serialized:string):number {
      /* istanbul ignore next */
      return this.fromBuffer(bintools.cb58Decode(serialized));
  }

  /**
   * Returns a base-58 representation of the [[UTXO]].
   *
   * @remarks
   * unlike most toStrings, this returns in cb58 serialization format
   */
  toString():string {
    /* istanbul ignore next */
    return bintools.cb58Encode(this.toBuffer());
  }

  clone():this {
    const utxo:UTXO = new UTXO();
    utxo.fromBuffer(this.toBuffer());
    return utxo as this;
  }

  create(
    codecID:number = PlatformVMConstants.LATESTCODEC, 
    txid:Buffer = undefined,
    outputidx:Buffer | number = undefined,
    assetid:Buffer = undefined,
    output:Output = undefined):this 
  {
    return new UTXO(codecID, txid, outputidx, assetid, output) as this;
  }

}

/**
 * Class for managing asset amounts in the UTXOSet fee calcuation
 */
export class AssetAmount {
  protected assetID:Buffer = Buffer.alloc(32);
  protected amount:BN = new BN(0);
  protected burn:BN = new BN(0);
  protected spent:BN = new BN(0);
  protected change:BN = new BN(0);
  protected finished:boolean = false;

  getAssetID = ():Buffer => {
    return this.assetID;
  }

  getAssetIDString = ():string => {
    return this.assetID.toString("hex");
  }

  getAmount = ():BN => {
    return this.amount
  }

  getSpent = ():BN => {
    return this.spent;
  }

  getBurn = ():BN => {
    return this.burn;
  }

  getChange = ():BN => {
    return this.change;
  }

  isFinished = ():boolean => {
    return this.finished;
  }

  spendAmount = (amt:BN):boolean => {
    
    if(!this.finished) {
      let total:BN = this.amount.add(this.burn);
      this.spent = this.spent.add(amt);
      if(this.spent.gte(this.amount)){
        if(this.spent.gte(total)){
          this.change = this.change.add(this.spent.sub(total));
        } else {
          this.change = new BN(0);
        }
        this.spent = total;
        this.finished = true;
      }
    }
    return this.finished;
  }

  constructor(assetID:Buffer, amount:BN, burn:BN) {
    this.assetID = assetID;
    this.amount = typeof amount === "undefined" ? new BN(0) : amount;
    this.burn = typeof burn === "undefined" ? new BN(0) : burn;
    this.spent = new BN(0);
  }
}

export class AssetAmountDestination {
  protected amounts:Array<AssetAmount> = [];
  protected destinations:Array<Buffer> = [];
  protected senders:Array<Buffer> = [];
  protected changeAddresses:Array<Buffer> = [];
  protected amountkey:object = {};
  protected inputs:Array<TransferableInput> = [];
  protected outputs:Array<TransferableOutput> = [];
  protected change:Array<TransferableOutput> = [];

  addAssetAmount = (assetID:Buffer, amount:BN, burn:BN) => {
    let aa:AssetAmount = new AssetAmount(assetID, amount, burn);
    this.amounts.push(aa);
    this.amountkey[aa.getAssetIDString()] = aa;
  }

  addInput = (input:TransferableInput) => {
    this.inputs.push(input);
  }

  addOutput = (output:TransferableOutput) => {
    this.outputs.push(output);
  }

  addChange = (output:TransferableOutput) => {
    this.change.push(output);
  }

  getAmounts = ():Array<AssetAmount> => {
    return this.amounts;
  }

  getDestinations = ():Array<Buffer> => {
    return this.destinations;
  }

  getSenders = ():Array<Buffer> => {
    return this.senders;
  }

  getChangeAddresses = ():Array<Buffer> => {
    return this.changeAddresses;
  }

  getAssetAmount = (assetHexStr:string):AssetAmount => {
    return this.amountkey[assetHexStr];
  }

  assetExists = (assetHexStr:string):boolean => {
    return (assetHexStr in this.amountkey);
  }

  getInputs = ():Array<TransferableInput> => {
    return this.inputs;
  }

  getOutputs = ():Array<TransferableOutput> => {
    return this.outputs;
  }

  getChangeOutputs = ():Array<TransferableOutput> => {
    return this.change;
  }

  getAllOutputs = ():Array<TransferableOutput> => {
    return this.outputs.concat(this.change);
  }

  canComplete = ():boolean => {
    for(let i = 0; i < this.amounts.length; i++) {
      if(!this.amounts[i].isFinished()) {

        return false;
      }
    }
    return true;
  }

  constructor(destinations:Array<Buffer>, senders:Array<Buffer>, changeAddresses:Array<Buffer>) {
    this.destinations = destinations;
    this.changeAddresses = changeAddresses;
    this.senders = senders;
  }

}

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet extends StandardUTXOSet<UTXO>{

  parseUTXO(utxo:UTXO | string):UTXO {
    const utxovar:UTXO = new UTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxovar.fromBuffer(bintools.cb58Decode(utxo));
    } else if (utxo instanceof StandardUTXO) {
      utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
    } else {
      /* istanbul ignore next */
      throw new Error(`Error - UTXO.parseUTXO: utxo parameter is not a UTXO or string: ${utxo}`);
    }
    return utxovar
  }

  create():this{
    return new UTXOSet() as this;
  }

  clone():this {
    const newset:UTXOSet = this.create();
    const allUTXOs:Array<UTXO> = this.getAllUTXOs();
    newset.addArray(allUTXOs)
    return newset as this;
  }

  protected getMinimumSpendable = (aad:AssetAmountDestination, asOf:BN = UnixNow(), locktime:BN = new BN(0), threshold:number = 1):Error => {
    const utxoArray:Array<UTXO> = this.getAllUTXOs();
    const outids:object = {};
    for(let i = 0; i < utxoArray.length && !aad.canComplete(); i++) {
      const u:UTXO = utxoArray[i];
      const assetKey:string = u.getAssetID().toString("hex");
      const fromAddresses:Array<Buffer> = aad.getSenders();
      if(u.getOutput() instanceof AmountOutput && aad.assetExists(assetKey) && u.getOutput().meetsThreshold(fromAddresses, asOf)) {
        const am:AssetAmount = aad.getAssetAmount(assetKey);
        if(!am.isFinished()){
          const uout:AmountOutput = u.getOutput() as AmountOutput;
          outids[assetKey] = uout.getOutputID();
          const amount = uout.getAmount();
          am.spendAmount(amount);
          const txid:Buffer = u.getTxID();
          const outputidx:Buffer = u.getOutputIdx();
          const input:SecpInput = new SecpInput(amount);
          const xferin:TransferableInput = new TransferableInput(txid, outputidx, u.getAssetID(), input);
          const spenders:Array<Buffer> = uout.getSpenders(fromAddresses, asOf);
          for (let j = 0; j < spenders.length; j++) {
            const idx:number = uout.getAddressIdx(spenders[j]);
            if (idx === -1) {
              /* istanbul ignore next */
              throw new Error('Error - UTXOSet.buildBaseTx: no such '
              + `address in output: ${spenders[j]}`);
            }
            xferin.getInput().addSignatureIdx(idx, spenders[j]);
          }
          aad.addInput(xferin);
        } else if(aad.assetExists(assetKey) && !(u.getOutput() instanceof AmountOutput)){
          /**
           * Leaving the below lines, not simply for posterity, but for clarification.
           * AssetIDs may have mixed OutputTypes. 
           * Some of those OutputTypes may implement AmountOutput.
           * Others may not.
           * Simply continue in this condition.
           */
          /*return new Error('Error - UTXOSet.getMinimumSpendable: outputID does not '
            + `implement AmountOutput: ${u.getOutput().getOutputID}`);*/
            continue;
        }
      }
    }
    if(!aad.canComplete()) {
      return new Error('Error - UTXOSet.getMinimumSpendable: insufficient '
      + 'funds to create the transaction');
    }
    const amounts:Array<AssetAmount> = aad.getAmounts();
    const zero:BN = new BN(0);
    for(let i = 0; i < amounts.length; i++) {
      const assetKey:string = amounts[i].getAssetIDString();
      const amount:BN = amounts[i].getAmount();
      const change:BN = amounts[i].getChange();
      const spendout:AmountOutput = SelectOutputClass(outids[assetKey],
        amount, aad.getDestinations(), locktime, threshold) as AmountOutput;
      const xferout:TransferableOutput = new TransferableOutput(amounts[i].getAssetID(), spendout);
      aad.addOutput(xferout);
      if (change.gt(zero)) {
        const changeout:AmountOutput = SelectOutputClass(outids[assetKey],
          change, aad.getChangeAddresses()) as AmountOutput;
        const chgxferout:TransferableOutput = new TransferableOutput(amounts[i].getAssetID(), changeout);
        aad.addOutput(chgxferout);
      }
    }
    return undefined;
  }

}
