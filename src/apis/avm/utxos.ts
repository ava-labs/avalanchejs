/**
 * @packageDocumentation
 * @module API-AVM-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import BN from "bn.js";
import { AmountOutput, SelectOutputClass, TransferableOutput, NFTTransferOutput, NFTMintOutput } from './outputs';
import { AVMConstants } from './constants';
import { UnsignedTx,  } from './tx';
import { SecpInput, TransferableInput } from './inputs';
import { NFTTransferOperation, TransferableOperation, NFTMintOperation } from './ops';
import { Output, OutputOwners } from '../../common/output';
import { UnixNow } from '../../utils/helperfunctions';
import { InitialStates } from './initialstates';
import { MinterSet } from './minterset';
import { StandardUTXO, StandardUTXOSet } from '../../common/utxos';
import { CreateAssetTx } from './createassettx';
import { OperationTx } from './operationtx';
import { BaseTx } from './basetx';
import { ExportTx } from './exporttx';
import { ImportTx } from './importtx';
import { PlatformChainID } from '../../utils/constants';

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
    codecID:number = AVMConstants.LATESTCODEC, 
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

  /**
     * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
     * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
     *
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param amount The amount of the asset to be spent in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}.
     * @param assetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
     * @param toAddresses The addresses to send the funds
     * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
     * @param changeAddresses Optional. The addresses that can spend the change remaining from the spent UTXOs. Default: toAddresses
     * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
     * @param feeAssetID Optional. The assetID of the fees being burned. Default: assetID
     * @param memo Optional. Contains arbitrary data, up to 256 bytes
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime Optional. The locktime field created in the resulting outputs
     * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
     * 
     * @returns An unsigned transaction created from the passed in parameters.
     *
     */
  buildBaseTx = (
    networkid:number,
    blockchainid:Buffer,
    amount:BN,
    assetID:Buffer,
    toAddresses:Array<Buffer>,
    fromAddresses:Array<Buffer>,
    changeAddresses:Array<Buffer> = undefined,
    fee:BN = undefined,
    feeAssetID:Buffer = undefined,
    memo:Buffer = undefined,
    asOf:BN = UnixNow(),
    locktime:BN = new BN(0),
    threshold:number = 1
  ):UnsignedTx => {

    if(threshold > toAddresses.length) {
      /* istanbul ignore next */
      throw new Error(`Error - UTXOSet.buildBaseTx: threshold is greater than number of addresses`);
    }

    if(typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses;
    }

    if(typeof feeAssetID === "undefined") {
      feeAssetID = assetID;
    }

    const zero:BN = new BN(0);
    
    if (amount.eq(zero)) {
      return undefined;
    }

    const aad:AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
    if(assetID.toString("hex") === feeAssetID.toString("hex")){
      aad.addAssetAmount(assetID, amount, fee);
    } else {
      aad.addAssetAmount(assetID, amount, zero);
      aad.addAssetAmount(feeAssetID, zero, fee);
    }

    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    
    const success:Error = this.getMinimumSpendable(aad, asOf, locktime, threshold);
    if(typeof success === "undefined") {
      ins = aad.getInputs();
      outs = aad.getAllOutputs();
    } else {
      throw success;
    }

    const baseTx:BaseTx = new BaseTx(networkid, blockchainid, outs, ins, memo);
    return new UnsignedTx(baseTx);

  };

  /**
     * Creates an unsigned transaction. For more granular control, you may create your own
     * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
     * 
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
     * @param initialState The [[InitialStates]] that represent the intial state of a created asset
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
     * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
     * @param feeAssetID Optional. The assetID of the fees being burned.
     * @param memo Optional contains arbitrary bytes, up to 256 bytes
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     *
     * @returns An unsigned transaction created from the passed in parameters.
     *
     */
  buildCreateAssetTx = (
      networkid:number, 
      blockchainid:Buffer, 
      fromAddresses:Array<Buffer>,
      initialState:InitialStates, 
      name:string, 
      symbol:string, 
      denomination:number, 
      fee:BN = undefined,
      feeAssetID:Buffer = undefined, 
      memo:Buffer = undefined, 
      asOf:BN = UnixNow()
  ):UnsignedTx => {
    const zero:BN = new BN(0);
    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    
    if(typeof fee !== "undefined" && typeof feeAssetID !== "undefined"){
      const aad:AssetAmountDestination = new AssetAmountDestination(fromAddresses, fromAddresses, fromAddresses);
      aad.addAssetAmount(feeAssetID, zero, fee);
      const success:Error = this.getMinimumSpendable(aad, asOf);
      if(typeof success === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw success;
      }
    }
    let CAtx:CreateAssetTx = new CreateAssetTx(networkid, blockchainid, outs, ins, memo, name, symbol, denomination, initialState);
    return new UnsignedTx(CAtx);
  }

  /**
   * Creates an unsigned transaction. For more granular control, you may create your own
    * [[CreateAssetTX]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
    * 
    * @param networkid The number representing NetworkID of the node
    * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
    * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
    * @param minterSets The minters and thresholds required to mint this nft asset
    * @param name String for the descriptive name of the nft asset
    * @param symbol String for the ticker symbol of the nft asset
    * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
    * @param feeAssetID Optional. The assetID of the fees being burned.
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * @param locktime Optional. The locktime field created in the resulting mint output
    * 
    * @returns An unsigned transaction created from the passed in parameters.
    * 
    */
  buildCreateNFTAssetTx = (
      networkid:number, 
      blockchainid:Buffer, 
      fromAddresses:Array<Buffer>,
      minterSets:Array<MinterSet>,
      name:string, 
      symbol:string,
      fee:BN = undefined,
      feeAssetID:Buffer = undefined,  
      memo:Buffer = undefined, 
      asOf:BN = UnixNow(),
      locktime:BN = undefined
  ):UnsignedTx => {
    const zero:BN = new BN(0);
    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    
    if(typeof fee !== "undefined" && typeof feeAssetID !== "undefined") {
      const aad:AssetAmountDestination = new AssetAmountDestination(fromAddresses, fromAddresses, fromAddresses);
      aad.addAssetAmount(feeAssetID, zero, fee);
      const success:Error = this.getMinimumSpendable(aad, asOf);
      if(typeof success === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw success;
      }
    }
    let initialState:InitialStates = new InitialStates();
    for(let i:number = 0; i < minterSets.length; i++) {
      let nftMintOutput:NFTMintOutput = new NFTMintOutput(
        i,
        minterSets[i].getMinters(),
        locktime, 
        minterSets[i].getThreshold()
        );
      initialState.addOutput(nftMintOutput, AVMConstants.NFTFXID);
    }
    let denomination:number = 0; // NFTs are non-fungible
    let CAtx:CreateAssetTx = new CreateAssetTx(networkid, blockchainid, outs, ins, memo, name, symbol, denomination, initialState);
    return new UnsignedTx(CAtx);
  }

  /**
   * Creates an unsigned NFT mint transaction. For more granular control, you may create your own
    * [[NFTMintTx]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
    * 
    * @param networkid The number representing NetworkID of the node
    * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
    * @param toAddresses The addresses to send the funds
    * @param fromAddresses The addresses being used to send the funds from the UTXOs
    * @param utxoids An array of strings for the NFTs being transferred
    * @param groupID Optional. The group this NFT is issued to.
    * @param payload Optional. Data for NFT Payload.
    * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
    * @param feeAssetID Optional. The assetID of the fees being burned. 
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * @param locktime Optional. The locktime field created in the resulting mint output
    * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
    * 
    * @returns An unsigned transaction created from the passed in parameters.
    * 
    */
  buildCreateNFTMintTx = (
    networkid:number, 
    blockchainid:Buffer, 
    toAddresses:Array<Buffer>, 
    fromAddresses:Array<Buffer>, 
    utxoids:Array<string>, 
    groupID:number = 0, 
    payload:Buffer = undefined, 
    fee:BN = undefined,
    feeAssetID:Buffer = undefined,  
    memo:Buffer = undefined,
    asOf:BN = UnixNow(), 
    locktime:BN, 
    threshold:number = 1 
  ):UnsignedTx => {

    const zero:BN = new BN(0);
    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    
    if(typeof fee !== "undefined" && typeof feeAssetID !== "undefined") {
      const aad:AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, fromAddresses);
      aad.addAssetAmount(feeAssetID, zero, fee);
      const success:Error = this.getMinimumSpendable(aad, asOf);
      if(typeof success === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw success;
      }
    }
    let ops:TransferableOperation[] = [];

    if(threshold > toAddresses.length) {
        /* istanbul ignore next */
        throw new Error(`Error - UTXOSet.buildCreateNFTMintTx: threshold is greater than number of addresses`);
    }
    let nftMintOperation: NFTMintOperation = new NFTMintOperation(groupID, payload, [new OutputOwners(toAddresses, locktime, threshold)]);

    for(let i:number = 0; i < utxoids.length; i++) {
        let utxo:UTXO = this.getUTXO(utxoids[i]);
        let out:NFTTransferOutput = utxo.getOutput() as NFTTransferOutput;
        let spenders:Array<Buffer> = out.getSpenders(fromAddresses, asOf);

        for(let j:number = 0; j < spenders.length; j++) {
            let idx:number;
            idx = out.getAddressIdx(spenders[j]);
            if(idx == -1){
                /* istanbul ignore next */
                throw new Error(`Error - UTXOSet.buildCreateNFTMintTx: no such address in output: ${spenders[j]}`);
            }
            nftMintOperation.addSignatureIdx(idx, spenders[j]);
        }
          
        let transferableOperation:TransferableOperation = new TransferableOperation(utxo.getAssetID(), utxoids, nftMintOperation);
        ops.push(transferableOperation);
    }

    let operationTx:OperationTx = new OperationTx(networkid, blockchainid, outs, ins, memo, ops);
    return new UnsignedTx(operationTx);
  }

  /**
   * Creates an unsigned NFT transfer transaction. For more granular control, you may create your own
    * [[NFTTransferOperation]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
    *
    * @param networkid The number representing NetworkID of the node
    * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
    * @param toAddresses An array of {@link https://github.com/feross/buffer|Buffer}s which indicate who recieves the NFT
    * @param fromAddresses An array for {@link https://github.com/feross/buffer|Buffer} who owns the NFT
    * @param utxoids An array of strings for the NFTs being transferred
    * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
    * @param feeAssetID Optional. The assetID of the fees being burned. 
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * @param locktime Optional. The locktime field created in the resulting outputs
    * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
    * @returns An unsigned transaction created from the passed in parameters.
    *
    */
  buildNFTTransferTx = (
    networkid:number, 
    blockchainid:Buffer, 
    toAddresses:Array<Buffer>, 
    fromAddresses:Array<Buffer>,
    utxoids:Array<string>,
    fee:BN = undefined,
    feeAssetID:Buffer = undefined, 
    memo:Buffer = undefined, 
    asOf:BN = UnixNow(),
    locktime:BN = new BN(0), 
    threshold:number = 1,
  ):UnsignedTx => {
    const zero:BN = new BN(0);
    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    
    if(typeof fee !== "undefined" && typeof feeAssetID !== "undefined") {
      const aad:AssetAmountDestination = new AssetAmountDestination(fromAddresses, fromAddresses, fromAddresses);
      aad.addAssetAmount(feeAssetID, zero, fee);
      const success:Error = this.getMinimumSpendable(aad, asOf);
      if(typeof success === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw success;
      }
    }
    const ops:Array<TransferableOperation> = [];
    for (let i:number = 0; i < utxoids.length; i++) {
      const utxo:UTXO = this.getUTXO(utxoids[i]);
  
      const out:NFTTransferOutput = utxo.getOutput() as NFTTransferOutput;
      const spenders:Array<Buffer> = out.getSpenders(fromAddresses, asOf);
  
      const outbound:NFTTransferOutput = new NFTTransferOutput(
        out.getGroupID(), out.getPayload(), toAddresses, locktime, threshold, 
      );
      const op:NFTTransferOperation = new NFTTransferOperation(outbound);
  
      for (let j = 0; j < spenders.length; j++) {
        const idx:number = out.getAddressIdx(spenders[j]);
        if (idx === -1) {
          /* istanbul ignore next */
          throw new Error('Error - UTXOSet.buildNFTTransferTx: '
          + `no such address in output: ${spenders[j]}`);
        }
        op.addSignatureIdx(idx, spenders[j]);
      }
  
      const xferop:TransferableOperation = new TransferableOperation(utxo.getAssetID(),
        [utxoids[i]],
        op);
      ops.push(xferop);
    }
    const OpTx:OperationTx = new OperationTx(networkid, blockchainid, outs, ins, memo, ops);
    return new UnsignedTx(OpTx);
  };

  /**
    * Creates an unsigned ImportTx transaction.
    *
    * @param networkid The number representing NetworkID of the node
    * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
    * @param fromAddresses An array for {@link https://github.com/feross/buffer|Buffer} who owns the AVAX
    * @param importIns An array of [[TransferableInput]]s being imported
    * @param sourceChain A {@link https://github.com/feross/buffer|Buffer} for the chainid where the imports are coming from.
    * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
    * @param feeAssetID Optional. The assetID of the fees being burned. 
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * @returns An unsigned transaction created from the passed in parameters.
    *
    */
   buildImportTx = (
    networkid:number, 
    blockchainid:Buffer,
    fromAddresses:Array<Buffer>,
    importIns:Array<TransferableInput>,
    destinationChain:Buffer = undefined, 
    fee:BN = undefined,
    feeAssetID:Buffer = undefined, 
    memo:Buffer = undefined, 
    asOf:BN = UnixNow(),
  ):UnsignedTx => {
    const zero:BN = new BN(0);
    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    
    // Not implemented: Fees can be paid from importIns
    if(typeof fee !== "undefined" && typeof feeAssetID !== "undefined") {
      const aad:AssetAmountDestination = new AssetAmountDestination(fromAddresses, fromAddresses, fromAddresses);
      aad.addAssetAmount(feeAssetID, zero, fee);
      const success:Error = this.getMinimumSpendable(aad, asOf);
      if(typeof success === "undefined") {
        ins = aad.getInputs();
        outs = aad.getAllOutputs();
      } else {
        throw success;
      }
    }

    if(typeof destinationChain === "undefined") {
      destinationChain = bintools.cb58Decode(PlatformChainID);
    }

    const importTx:ImportTx = new ImportTx(networkid, blockchainid, destinationChain, outs, ins, memo, importIns);
    return new UnsignedTx(importTx);
  };

    /**
    * Creates an unsigned ExportTx transaction. 
    *
    * @param networkid The number representing NetworkID of the node
    * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
    * @param amount The amount being exported as a {@link https://github.com/indutny/bn.js/|BN}
    * @param avaxAssetID {@link https://github.com/feross/buffer|Buffer} of the asset ID for AVAX
    * @param toAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who recieves the AVAX
    * @param fromAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who owns the AVAX
    * @param changeAddresses An array of addresses as {@link https://github.com/feross/buffer|Buffer} who gets the change leftover of the AVAX
    * @param fee Optional. The amount of fees to burn in its smallest denomination, represented as {@link https://github.com/indutny/bn.js/|BN}
    * @param destinationChain Optional. A {@link https://github.com/feross/buffer|Buffer} for the chainid where to send the asset.
    * @param feeAssetID Optional. The assetID of the fees being burned. 
    * @param memo Optional contains arbitrary bytes, up to 256 bytes
    * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
    * @param locktime Optional. The locktime field created in the resulting outputs
    * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
    * @returns An unsigned transaction created from the passed in parameters.
    *
    */
   buildExportTx = (
    networkid:number, 
    blockchainid:Buffer,
    amount:BN,
    avaxAssetID:Buffer,
    toAddresses:Array<Buffer>,
    fromAddresses:Array<Buffer>,
    changeAddresses:Array<Buffer> = undefined,
    destinationChain:Buffer = undefined,
    fee:BN = undefined,
    feeAssetID:Buffer = undefined, 
    memo:Buffer = undefined, 
    asOf:BN = UnixNow(),
    locktime:BN = new BN(0), 
    threshold:number = 1,
  ):UnsignedTx => {
    let ins:Array<TransferableInput> = [];
    let outs:Array<TransferableOutput> = [];
    let exportouts:Array<TransferableOutput> = [];
    
    if(typeof changeAddresses === "undefined") {
      changeAddresses = toAddresses;
    }

    const zero:BN = new BN(0);
    
    if (amount.eq(zero)) {
      return undefined;
    }

    if(typeof feeAssetID === "undefined") {
      feeAssetID = avaxAssetID;
    } else if (feeAssetID.toString("hex") !== avaxAssetID.toString("hex")) {
      /* istanbul ignore next */
      throw new Error('Error - UTXOSet.buildExportTx: '
      + `feeAssetID must match avaxAssetID`);
    }

    if(typeof destinationChain === "undefined") {
      destinationChain = bintools.cb58Decode(PlatformChainID);
    }

    const aad:AssetAmountDestination = new AssetAmountDestination(toAddresses, fromAddresses, changeAddresses);
    if(avaxAssetID.toString("hex") === feeAssetID.toString("hex")){
      aad.addAssetAmount(avaxAssetID, amount, fee);
    } else {
      aad.addAssetAmount(avaxAssetID, amount, zero);
      aad.addAssetAmount(feeAssetID, zero, fee);
    }
    const success:Error = this.getMinimumSpendable(aad, asOf, locktime, threshold);
    if(typeof success === "undefined") {
      ins = aad.getInputs();
      outs = aad.getChangeOutputs();
      exportouts = aad.getOutputs();
    } else {
      throw success;
    }

    const exportTx:ExportTx = new ExportTx(networkid, blockchainid, destinationChain, outs, ins, memo, exportouts);
    return new UnsignedTx(exportTx);
  };
}
