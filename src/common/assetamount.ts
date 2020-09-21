/**
 * @packageDocumentation
 * @module Common-AssetAmount
 */

import { Buffer } from 'buffer/';
import BN from 'bn.js';
import { StandardTransferableOutput } from './output';
import { StandardTransferableInput } from './input';

/**
 * Class for managing asset amounts in the UTXOSet fee calcuation
 */
export class AssetAmount {
    protected assetID:Buffer = Buffer.alloc(32);
    protected amount:BN = new BN(0);
    protected burn:BN = new BN(0);
    protected spent:BN = new BN(0);
    protected change:BN = new BN(0);
    protected stakeableLockSpent:BN  = new BN(0);
    protected stakeableLockChange:boolean = false;
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

    getStakeableLockSpent = ():BN => {
      return this.stakeableLockSpent;
    }

    getStakeableLockChange = ():boolean => {
      return this.stakeableLockChange;
    }
  
    isFinished = ():boolean => {
      return this.finished;
    }
  
    spendAmount = (amt:BN, stakeableLocked:boolean = false):boolean => {
      if(!this.finished) {
        let total:BN = this.amount.add(this.burn);
        this.spent = this.spent.add(amt);
        if(stakeableLocked){
          this.stakeableLockSpent = this.stakeableLockSpent.add(amt);
        }
        if(this.spent.gte(total)) {
          this.change = this.spent.sub(total);
          if(stakeableLocked){
            this.stakeableLockChange = true;
          }
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
      this.stakeableLockSpent = new BN(0);
      this.stakeableLockChange = false;
    }
  }
  
  export abstract class StandardAssetAmountDestination<TO extends StandardTransferableOutput, TI extends StandardTransferableInput>  {
    protected amounts:Array<AssetAmount> = [];
    protected destinations:Array<Buffer> = [];
    protected senders:Array<Buffer> = [];
    protected changeAddresses:Array<Buffer> = [];
    protected amountkey:object = {};
    protected inputs:Array<TI> = [];
    protected outputs:Array<TO> = [];
    protected change:Array<TO> = [];
  
    addAssetAmount = (assetID:Buffer, amount:BN, burn:BN) => {
      let aa:AssetAmount = new AssetAmount(assetID, amount, burn);
      this.amounts.push(aa);
      this.amountkey[aa.getAssetIDString()] = aa;
    }
  
    addInput = (input:TI) => {
      this.inputs.push(input);
    }
  
    addOutput = (output:TO) => {
      this.outputs.push(output);
    }
  
    addChange = (output:TO) => {
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
  
    getInputs = ():Array<TI> => {
      return this.inputs;
    }
  
    getOutputs = ():Array<TO> => {
      return this.outputs;
    }
  
    getChangeOutputs = ():Array<TO> => {
      return this.change;
    }
  
    getAllOutputs = ():Array<TO> => {
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