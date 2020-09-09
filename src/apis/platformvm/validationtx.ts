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
import { DefaultNetworkID } from '../../utils/constants';
import { bufferToNodeIDString } from '../../utils/helperfunctions';
import { AmountOutput } from './outputs';

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

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getNodeID():Buffer {
        return this.nodeID;
    }

    /**
     * Returns a string for the nodeID amount.
     */
    getNodeIDString():string {
        return bufferToNodeIDString(this.nodeID);
    }
    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getStartTime(){
        return bintools.fromBufferToBN(this.startTime);
    }

    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
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


export class AddSubnetValidatorTx extends ValidatorTx {
    protected weight:Buffer = Buffer.alloc(8);

    /**
     * Returns the id of the [[AddSubnetValidatorTx]]
     */
    getTxType = ():number => {
    return PlatformVMConstants.ADDSUBNETVALIDATORTX;
    }

    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getWeight():BN {
        return bintools.fromBufferToBN(this.weight);
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getWeightBuffer():Buffer {
        return this.weight;
    }

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.weight = bintools.copyFrom(bytes, offset, offset + 8);
        offset += 8;
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddSubnetValidatorTx]].
     */
    toBuffer():Buffer {
        const superbuff:Buffer = super.toBuffer();
        return Buffer.concat([superbuff, this.weight]);
    }

    /**
     * Class representing an unsigned AddSubnetValidatorTx transaction.
     *
     * @param networkid Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
     * @param weight Optional. The amount of nAVAX the validator is staking.
     */
    constructor(
        networkid:number = DefaultNetworkID, 
        blockchainid:Buffer = Buffer.alloc(32, 16), 
        outs:Array<TransferableOutput> = undefined, 
        ins:Array<TransferableInput> = undefined, 
        memo:Buffer = undefined, 
        nodeID:Buffer = undefined, 
        startTime:BN = undefined, 
        endTime:BN = undefined,
        weight:BN = undefined,
    ) {
        super(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime);
        if(typeof weight !== undefined){
            this.weight = bintools.fromBNToBuffer(weight, 8);
        }
    }

}


/**
 * Class representing an unsigned AddDelegatorTx transaction.
 */
export class AddDelegatorTx extends AddSubnetValidatorTx {
    
    protected stakeOuts:Array<TransferableOutput> = [];
    protected rewardAddress:Buffer = Buffer.alloc(20);
  
    /**
       * Returns the id of the [[AddDelegatorTx]]
       */
    getTxType = ():number => {
      return PlatformVMConstants.ADDDELEGATORTX;
    }

    /**
     * Returns a {@link https://github.com/indutny/bn.js/|BN} for the stake amount.
     */
    getStakeAmount():BN {
        return this.getWeight();
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the stake amount.
     */
    getStakeAmountBuffer():Buffer {
        return this.weight;
    }

    /**
     * Returns the array of outputs being staked.
     */
    getStakeOuts():Array<TransferableOutput> {
        return this.stakeOuts;
    }

    /**
     * Should match stakeAmount. Used in sanity checking.
     */
    getStakeOutsTotal():BN {
        let val:BN = new BN(0);
        for(let i = 0; i < this.stakeOuts.length; i++){
          val = val.add((this.stakeOuts[i].getOutput() as AmountOutput).getAmount());
        }
        return val;
    }
    
    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} for the reward address.
     */
    getRewardAddress():Buffer {
        return this.rewardAddress;
    }
    
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        const numstakeouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        const outcount:number = numstakeouts.readUInt32BE(0);
        this.outs = [];
        for(let i = 0; i < outcount; i++) {
            const xferout:TransferableOutput = new TransferableOutput();
            offset = xferout.fromBuffer(bytes, offset);
            this.outs.push(xferout);
        }
        this.rewardAddress = bintools.copyFrom(bytes, offset, offset + PlatformVMConstants.ADDRESSLENGTH);
        offset += PlatformVMConstants.ADDRESSLENGTH;
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[AddDelegatorTx]].
     */
    toBuffer():Buffer {
        const superbuff:Buffer = super.toBuffer();
        let bsize:number = superbuff.length;
        const numouts:Buffer = Buffer.alloc(4);
        numouts.writeUInt32BE(this.stakeOuts.length, 0);
        let barr:Array<Buffer> = [super.toBuffer(), this.weight, numouts];
        this.stakeOuts = this.stakeOuts.sort(TransferableOutput.comparator());
        for(let i = 0; i < this.stakeOuts.length; i++) {
            let out:Buffer = this.stakeOuts[i].toBuffer();
            barr.push(out);
            bsize += out.length;
        }
        barr.push(this.rewardAddress);
        bsize += this.rewardAddress.length;
        return Buffer.concat(barr, bsize);
      }
  
    /**
     * Class representing an unsigned AddDelegatorTx transaction.
     *
     * @param networkid Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
     * @param stakeAmount Optional. The amount of nAVAX the validator is staking.
     * @param stakeOuts Optional. The outputs used in paying the stake.
     * @param rewardAddress Optional. The address the validator reward goes.
     */
    constructor(
        networkid:number = DefaultNetworkID, 
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
        super(networkid, blockchainid, outs, ins, memo, nodeID, startTime, endTime, stakeAmount);
        if(typeof stakeOuts !== undefined){
            this.stakeOuts = stakeOuts
        }
        this.rewardAddress = rewardAddress;
    }
  }

export class AddValidatorTx extends AddDelegatorTx {
    protected delegationFee:number = 0;
    private static delegatorMultiplier:number = 10000;

    /**
       * Returns the id of the [[AddDelegatorTx]]
       */
    getTxType = ():number => {
    return PlatformVMConstants.ADDVALIDATORTX;
    }

    /**
     * Returns the delegation fee (represents a percentage from 0 to 100);
     */
    getDelegationFee():number {
        return this.delegationFee;
    }

    /**
     * Returns the binary representation of the delegation fee as a {@link https://github.com/feross/buffer|Buffer}.
     */
    getDelegationFeeBuffer():Buffer {
        let dBuff:Buffer = Buffer.alloc(4);
        let buffnum:number = parseFloat(this.delegationFee.toFixed(4)) * AddValidatorTx.delegatorMultiplier;
        dBuff.writeUInt32BE(buffnum, 0);
        return dBuff;
    }

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        let dbuff:Buffer = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.delegationFee = dbuff.readUInt32BE(0) / AddValidatorTx.delegatorMultiplier;
        return offset;
    }

    toBuffer():Buffer {
        let superBuff:Buffer = super.toBuffer();
        let feeBuff:Buffer = this.getDelegationFeeBuffer();
        return Buffer.concat([superBuff, feeBuff]);
    }

    /**
     * Class representing an unsigned AddValidatorTx transaction.
     *
     * @param networkid Optional. Networkid, [[DefaultNetworkID]]
     * @param blockchainid Optional. Blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional. Array of the [[TransferableOutput]]s
     * @param ins Optional. Array of the [[TransferableInput]]s
     * @param memo Optional. {@link https://github.com/feross/buffer|Buffer} for the memo field
     * @param nodeID Optional. The node ID of the validator being added.
     * @param startTime Optional. The Unix time when the validator starts validating the Primary Network.
     * @param endTime Optional. The Unix time when the validator stops validating the Primary Network (and staked AVAX is returned).
     * @param stakeAmount Optional. The amount of nAVAX the validator is staking.
     * @param stakeOuts Optional. The outputs used in paying the stake.
     * @param rewardAddress Optional. The address the validator reward goes to.
     * @param delegationFee Optional. The percent fee this validator charges when others delegate stake to them. 
     * Up to 4 decimal places allowed; additional decimal places are ignored. Must be between 0 and 100, inclusive. 
     * For example, if delegationFeeRate is 1.2345 and someone delegates to this validator, then when the delegation 
     * period is over, 1.2345% of the reward goes to the validator and the rest goes to the delegator.
     */
    constructor(
        networkid:number = DefaultNetworkID, 
        blockchainid:Buffer = Buffer.alloc(32, 16), 
        outs:Array<TransferableOutput> = undefined, 
        ins:Array<TransferableInput> = undefined, 
        memo:Buffer = undefined, 
        nodeID:Buffer = undefined, 
        startTime:BN = undefined, 
        endTime:BN = undefined,
        stakeAmount:BN = undefined,
        stakeOuts:Array<TransferableOutput> = undefined,
        rewardAddress:Buffer = undefined,
        delegationFee:number = undefined
    ) {
        super(
            networkid, 
            blockchainid, 
            outs, 
            ins, 
            memo, 
            nodeID, 
            startTime, 
            endTime,
            stakeAmount,
            stakeOuts,
            rewardAddress
        );
        if(typeof delegationFee === "number") {
            if(delegationFee >= 0 && delegationFee <= 100) {
                this.delegationFee = parseFloat(delegationFee.toFixed(4));
            } else {
                throw new Error("AddValidatorTx.constructor -- delegationFee must be in the range of 0 and 100, inclusively.");
            }
        }
    }
  }