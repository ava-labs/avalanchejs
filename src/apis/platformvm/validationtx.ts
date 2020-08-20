/**
 * @packageDocumentation
 * @module API-PlatformVM-ValidationTx
 */

import BN from 'bn.js';
import BinTools from '../../utils/bintools';
import { BaseTx } from './basetx';
import { TransferableOutput } from '../platformvm/outputs';
import { TransferableInput } from '../platformvm/inputs';
import { Buffer } from 'buffer/';
import { PlatformVMConstants } from './constants';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Abstract class representing an transactions with validation information.
 */
export abstract class ValidatorTx extends BaseTx {
    protected nodeID:Buffer = Buffer.alloc(20);
    protected startTime:Buffer = Buffer.alloc(8);
    protected endTime:Buffer = Buffer.alloc(8);

    getNodeID():Buffer {
        return this.nodeID;
    }

    getNodeIDString():string {
        return bintools.cb58Encode(this.nodeID);
    }

    getStartTime(){
        return bintools.fromBufferToBN(this.startTime);
    }

    getEndTime() {
        return bintools.fromBufferToBN(this.endTime);
    }

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.nodeID = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        this.startTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        this.endTime = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ValidatorTx]].
     */
    toBuffer():Buffer {
        const superbuff:Buffer = super.toBuffer();
        const bsize:number = superbuff.length + this.nodeID.length + this.startTime.length + this.endTime.length;
        return Buffer.concat([
            superbuff,
            this.nodeID,
            this.startTime,
            this.endTime
        ], bsize);
      }

    constructor(
        networkid:number, 
        blockchainid:Buffer, 
        outs:Array<TransferableOutput>, 
        ins:Array<TransferableInput>, 
        memo?:Buffer, 
        nodeID?:Buffer, 
        startTime?:BN, 
        endTime?:BN
    ) {
        super(networkid, blockchainid, outs, ins, memo);
        this.nodeID = nodeID;
        this.startTime = bintools.fromBNToBuffer(startTime, 8);
        this.endTime = bintools.fromBNToBuffer(endTime, 8);
    }

}

/**
 * Class representing an unsigned AddDefaultSubnetDelegatorTx transaction.
 */
export class AddDefaultSubnetDelegatorTx extends ValidatorTx {
    protected stakeAmount:Buffer = Buffer.alloc(8);
    protected stakeOuts:Array<TransferableOutput> = [];
    protected rewardAddress:Buffer = Buffer.alloc(20);
  
    /**
       * Returns the id of the [[AddDefaultSubnetDelegatorTx]]
       */
    getTxType = ():number => {
      return PlatformVMConstants.ADDDEFAULTSUBNETDELEGATORTX;
    }
    
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.stakeAmount = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        const numstakeouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount:number = numstakeouts.readUInt32BE(0);
        this.outs = [];
        for(let i = 0; i < outcount; i++) {
            const xferout:TransferableOutput = new TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.outs.push(xferout);
        }
        this.rewardAddress = bintools.copyFrom(bytes, offset, offset + 20);
        offset += 20;
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[ImportTx]].
     */
    toBuffer():Buffer {
        const superbuff:Buffer = super.toBuffer();
        let bsize:number = superbuff.length + this.stakeAmount.length;
        const numouts:Buffer = Buffer.alloc(4);
        numouts.writeUInt32BE(this.stakeOuts.length, 0);
        let barr:Array<Buffer> = [super.toBuffer(), this.stakeAmount, numouts];
        this.stakeOuts = this.stakeOuts.sort(TransferableOutput.comparator());
        for(let i = 0; i < this.stakeOuts.length; i++) {
            barr.push(this.stakeOuts[i].toBuffer());
        }
        barr.push(this.rewardAddress);
        bsize += this.rewardAddress.length;
        return Buffer.concat(barr, bsize);
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
        networkid:number = 1, 
        blockchainid:Buffer = Buffer.alloc(32, 16), 
        outs:Array<TransferableOutput> = undefined, 
        ins:Array<TransferableInput> = undefined, 
        memo:Buffer = undefined, 
        nodeID:Buffer = undefined, 
        startTime:BN = undefined, 
        endTime:BN = undefined,
        stakeAmount:BN = undefined,
        stakeOuts:Array<TransferableOutput> = undefined,
        rewardAddress:Buffer = undefined
    ) {
        super(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime);
        this.stakeAmount = bintools.fromBNToBuffer(stakeAmount, 8);
        if(typeof stakeOuts !== undefined){
            this.stakeOuts = stakeOuts
        }
        this.rewardAddress = rewardAddress;
    }
  }