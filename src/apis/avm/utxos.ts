/**
 * @packageDocumentation
 * @module AVMAPI-UTXOs
 */
import { Buffer } from 'buffer/';
import BN from 'bn.js';
import BinTools from '../../utils/bintools';
import {
  Output, AmountOutput, SelectOutputClass, TransferableOutput, NFTTransferOutput,
} from './outputs';
import {
  MergeRule, UnixNow, AVMConstants, InitialStates,
} from './types';
import {
  UnsignedTx, CreateAssetTx, OperationTx, BaseTx,
} from './tx';
import { SecpInput, TransferableInput } from './inputs';
import { NFTTransferOperation, TransferableOperation } from './ops';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Class for representing a single UTXO.
 */
export class UTXO {
  protected txid:Buffer = Buffer.alloc(32);

  protected outputidx:Buffer = Buffer.alloc(4);

  protected assetid:Buffer = Buffer.alloc(32);

  protected output:Output = undefined;

  /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} of the TxID.
     */
  getTxID = ()
  /* istanbul ignore next */
  :Buffer => this.txid;

  /**
     * Returns a {@link https://github.com/feross/buffer|Buffer}  of the OutputIdx.
     */
  getOutputIdx = ()
  /* istanbul ignore next */
  :Buffer => this.outputidx;

  /**
     * Returns the assetID as a {@link https://github.com/feross/buffer|Buffer}.
     */
  getAssetID = ():Buffer => this.assetid;

  /**
     * Returns the UTXOID as a base-58 string (UTXOID is a string )
     */
  getUTXOID = ()
  /* istanbul ignore next */
  :string => bintools.bufferToB58(Buffer.concat([this.getTxID(), this.getOutputIdx()]));

  /**
     * Returns a reference to the output;
    */
  getOutput = ():Output => this.output;

  /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[UTXO]]
     */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
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
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[UTXO]].
     */
  toBuffer():Buffer {
    const outbuff:Buffer = this.output.toBuffer();
    const outputidbuffer:Buffer = Buffer.alloc(4);
    outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
    const barr:Array<Buffer> = [this.txid, this.outputidx, this.assetid, outputidbuffer, outbuff];
    return Buffer.concat(barr,
      this.txid.length + this.outputidx.length
      + this.assetid.length
      + outputidbuffer.length + outbuff.length);
  }

  /**
     * Takes a base-58 string containing an [[UTXO]], parses it, populates the class, and returns the length of the UTXO in bytes.
     *
     * @param serialized A base-58 string containing a raw [[UTXO]]
     *
     * @returns The length of the raw [[UTXO]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in AVA format
     */
  fromString(serialized:string) {
    /* istanbul ignore next */
    return this.fromBuffer(bintools.avaDeserialize(serialized));
  }

  /**
     * Returns a base-58 representation of the [[UTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in AVA serialization format
     */
  toString():string {
    /* istanbul ignore next */
    return bintools.avaSerialize(this.toBuffer());
  }

  /**
     * Class for representing a single UTXO.
     *
     * @param txid Optional {@link https://github.com/feross/buffer|Buffer} of transaction ID for the UTXO
     * @param txidx Optional {@link https://github.com/feross/buffer|Buffer} or number for the index of the transaction's [[Output]]
     * @param assetid Optional {@link https://github.com/feross/buffer|Buffer} of the asset ID for the UTXO
     * @param outputid Optional {@link https://github.com/feross/buffer|Buffer} or number of the output ID for the UTXO
     */
  constructor(txid:Buffer = undefined,
    outputidx:Buffer | number = undefined,
    assetid:Buffer = undefined,
    output:Output = undefined) {
    if (typeof txid !== 'undefined'
    && typeof outputidx !== 'undefined'
    && typeof assetid !== 'undefined'
    && typeof output !== 'undefined') {
      this.txid = txid;
      if (typeof outputidx === 'number') {
        this.outputidx.writeUInt32BE(outputidx, 0);
      } else if (outputidx instanceof Buffer) {
        this.outputidx = outputidx;
      } else {
        /* istanbul ignore next */
        throw new Error('Error - UTXO.constructor: outputidx parameter is not a '
        + `number or a Buffer: ${outputidx}`);
      }

      this.assetid = assetid;
      this.output = output;
    }
  }
}

/**
 * Class representing a set of [[UTXO]]s.
 */
export class UTXOSet {
  protected utxos:{[utxoid: string]: UTXO } = {};

  protected addressUTXOs:{[address: string]: {[utxoid: string]: BN}} = {}; // maps address to utxoids:locktime

  /**
     * Returns true if the [[UTXO]] is in the UTXOSet.
     *
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     */
  includes = (utxo:UTXO | string):boolean => {
    const utxoX:UTXO = new UTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxoX.fromBuffer(bintools.avaDeserialize(utxo));
    } else {
      utxoX.fromBuffer(utxo.toBuffer()); // forces a copy
    }
    const utxoid:string = utxoX.getUTXOID();
    return (utxoid in this.utxos);
  };

  /**
     * Adds a UTXO to the UTXOSet.
     *
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns A [[UTXO]] if one was added and undefined if nothing was added.
     */
  add = (utxo:UTXO | string, overwrite:boolean = false):UTXO => {
    const utxovar:UTXO = new UTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxovar.fromBuffer(bintools.avaDeserialize(utxo));
    } else if (utxo instanceof UTXO) {
      utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
    } else {
      /* istanbul ignore next */
      throw new Error(`Error - UTXOSet.add: utxo parameter is not a UTXO or string: ${utxo}`);
    }
    const utxoid:string = utxovar.getUTXOID();
    if (!(utxoid in this.utxos) || overwrite === true) {
      this.utxos[utxoid] = utxovar;

      const addresses:Array<Buffer> = utxovar.getOutput().getAddresses();
      const locktime:BN = utxovar.getOutput().getLocktime();
      for (let i = 0; i < addresses.length; i++) {
        const address:string = addresses[i].toString('hex');
        if (!(address in this.addressUTXOs)) {
          this.addressUTXOs[address] = {};
        }
        this.addressUTXOs[address][utxoid] = locktime;
      }
      return utxovar;
    }
    return undefined;
  };

  /**
     * Adds an array of [[UTXO]]s to the [[UTXOSet]].
     *
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns An array of UTXOs which were added.
     */
  addArray = (utxos:Array<string | UTXO>, overwrite:boolean = false):Array<UTXO> => {
    const added:Array<UTXO> = [];
    for (let i = 0; i < utxos.length; i++) {
      const result:UTXO = this.add(utxos[i], overwrite);
      if (typeof result !== 'undefined') {
        added.push(result);
      }
    }
    return added;
  };

  /**
     * Removes a [[UTXO]] from the [[UTXOSet]] if it exists.
     *
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     *
     * @returns A [[UTXO]] if it was removed and undefined if nothing was removed.
     */
  remove = (utxo:UTXO | string):UTXO => {
    const utxovar:UTXO = new UTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxovar.fromBuffer(bintools.avaDeserialize(utxo));
    } else {
      utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
    }
    const utxoid:string = utxovar.getUTXOID();
    if (!(utxoid in this.utxos)) {
      return undefined;
    }
    delete this.utxos[utxoid];
    const addresses = Object.keys(this.addressUTXOs);
    for (let i = 0; i < addresses.length; i++) {
      if (utxoid in this.addressUTXOs[addresses[i]]) {
        delete this.addressUTXOs[addresses[i]][utxoid];
      }
    }
    return utxovar;
  };

  /**
     * Removes an array of [[UTXO]]s to the [[UTXOSet]].
     *
     * @param utxo Either a [[UTXO]] an AVA serialized string representing a UTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns An array of UTXOs which were removed.
     */
  removeArray = (utxos:Array<string | UTXO>):Array<UTXO> => {
    const removed:Array<UTXO> = [];
    for (let i = 0; i < utxos.length; i++) {
      const result:UTXO = this.remove(utxos[i]);
      if (typeof result !== 'undefined') {
        removed.push(result);
      }
    }
    return removed;
  };

  /**
     * Gets a [[UTXO]] from the [[UTXOSet]] by its UTXOID.
     *
     * @param utxoid String representing the UTXOID
     *
     * @returns A [[UTXO]] if it exists in the set.
     */
  getUTXO = (utxoid:string):UTXO => this.utxos[utxoid];

  /**
     * Gets all the [[UTXO]]s, optionally that match with UTXOIDs in an array
     *
     * @param utxoids An optional array of UTXOIDs, returns all [[UTXO]]s if not provided
     *
     * @returns An array of [[UTXO]]s.
     */
  getAllUTXOs = (utxoids:Array<string> = undefined):Array<UTXO> => {
    let results:Array<UTXO> = [];
    if (typeof utxoids !== 'undefined' && Array.isArray(utxoids)) {
      for (let i = 0; i < utxoids.length; i++) {
        if (utxoids[i] in this.utxos && !(utxoids[i] in results)) {
          results.push(this.utxos[utxoids[i]]);
        }
      }
    } else {
      results = Object.values(this.utxos);
    }
    return results;
  };

  /**
     * Gets all the [[UTXO]]s as strings, optionally that match with UTXOIDs in an array.
     *
     * @param utxoids An optional array of UTXOIDs, returns all [[UTXO]]s if not provided
     *
     * @returns An array of [[UTXO]]s as AVA serialized strings.
     */
  getAllUTXOStrings = (utxoids:Array<string> = undefined):Array<string> => {
    const results:Array<string> = [];
    const utxos = Object.keys(this.utxos);
    if (typeof utxoids !== 'undefined' && Array.isArray(utxoids)) {
      for (let i = 0; i < utxoids.length; i++) {
        if (utxoids[i] in this.utxos) {
          results.push(this.utxos[utxoids[i]].toString());
        }
      }
    } else {
      for (const u of utxos) {
        results.push(this.utxos[u].toString());
      }
    }
    return results;
  };

  /**
     * Given an address or array of addresses, returns all the UTXOIDs for those addresses
     *
     * @param address An array of address {@link https://github.com/feross/buffer|Buffer}s
     * @param spendable If true, only retrieves UTXOIDs whose locktime has passed
     *
     * @returns An array of addresses.
     */
  getUTXOIDs = (addresses:Array<Buffer> = undefined, spendable:boolean = true):Array<string> => {
    if (typeof addresses !== 'undefined') {
      const results:Array<string> = [];
      const now:BN = UnixNow();
      for (let i = 0; i < addresses.length; i++) {
        if (addresses[i].toString('hex') in this.addressUTXOs) {
          const entries = Object.entries(this.addressUTXOs[addresses[i].toString('hex')]);
          for (const [utxoid, locktime] of entries) {
            if ((results.indexOf(utxoid) === -1
            && (spendable && locktime.lte(now)))
            || !spendable) {
              results.push(utxoid);
            }
          }
        }
      }
      return results;
    }
    return Object.keys(this.utxos);
  };

  /**
     * Gets the addresses in the [[UTXOSet]] and returns an array of {@link https://github.com/feross/buffer|Buffer}.
     */
  getAddresses = ():Array<Buffer> => Object.keys(this.addressUTXOs)
    .map((k) => Buffer.from(k, 'hex'));

  /**
     * Returns the balance of a set of addresses in the UTXOSet.
     *
     * @param addresses An array of addresses
     * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an AVA serialized representation of an AssetID
     * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     *
     * @returns Returns the total balance as a {@link https://github.com/indutny/bn.js/|BN}.
     */
  getBalance = (addresses:Array<Buffer>, assetID:Buffer|string, asOf:BN = undefined):BN => {
    const utxoids:Array<string> = this.getUTXOIDs(addresses);
    const utxos:Array<UTXO> = this.getAllUTXOs(utxoids);
    let spend:BN = new BN(0);
    let asset:Buffer;
    if (typeof assetID === 'string') {
      asset = bintools.avaDeserialize(assetID);
    } else {
      asset = assetID;
    }
    for (let i = 0; i < utxos.length; i++) {
      if (utxos[i].getOutput() instanceof AmountOutput
      && utxos[i].getAssetID().toString('hex') === asset.toString('hex')
      && utxos[i].getOutput().meetsThreshold(addresses, asOf)) {
        spend = spend.add((utxos[i].getOutput() as AmountOutput).getAmount());
      }
    }
    return spend;
  };

  /**
     * Gets all the Asset IDs, optionally that match with Asset IDs in an array
     *
     * @param utxoids An optional array of Addresses as string or Buffer, returns all Asset IDs if not provided
     *
     * @returns An array of {@link https://github.com/feross/buffer|Buffer} representing the Asset IDs.
     */
  getAssetIDs = (addresses:Array<Buffer> = undefined):Array<Buffer> => {
    const results:Set<Buffer> = new Set();
    let utxoids:Array<string> = [];
    if (typeof addresses !== 'undefined') {
      utxoids = this.getUTXOIDs(addresses);
    } else {
      utxoids = this.getUTXOIDs();
    }

    for (let i = 0; i < utxoids.length; i++) {
      if (utxoids[i] in this.utxos && !(utxoids[i] in results)) {
        results.add(this.utxos[utxoids[i]].getAssetID());
      }
    }

    return [...results];
  };

  /**
     * Creates an [[UnsignedTx]] wrapping a [[BaseTx]]. For more granular control, you may create your own
     * [[UnsignedTx]] wrapping a [[BaseTx]] manually (with their corresponding [[TransferableInput]]s and [[TransferableOutput]]s).
     *
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param amount The amount of AVA to be spent in $nAVA
     * @param toAddresses The addresses to send the funds
     * @param fromAddresses The addresses being used to send the funds from the UTXOs {@link https://github.com/feross/buffer|Buffer}
     * @param changeAddresses The addresses that can spend the change remaining from the spent UTXOs
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime Optional. The locktime field created in the resulting outputs
     * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
     * @param outputID Optional. The outputID used for this transaction, must implement AmountOutput, default AVMConstants.SECPOUTPUTID
     *
     * @returns An unsigned transaction created from the passed in parameters.
     *
     */
  buildBaseTx = (
    networkid:number,
    blockchainid:Buffer,
    amount:BN,
    toAddresses:Array<Buffer>,
    fromAddresses:Array<Buffer>,
    changeAddresses:Array<Buffer>,
    assetID:Buffer,
    asOf:BN = UnixNow(),
    locktime:BN = new BN(0),
    threshold:number = 1,
    outputID = AVMConstants.SECPOUTPUTID,
  ):UnsignedTx => {
    const zero:BN = new BN(0);
    let spendamount:BN = zero.clone();
    const utxos:Array<UTXO> = this.getAllUTXOs(this.getUTXOIDs(fromAddresses));
    let change:BN = zero.clone();

    const outs:Array<TransferableOutput> = [];
    const ins:Array<TransferableInput> = [];
    if (!(SelectOutputClass(outputID) instanceof AmountOutput)) {
      /* istanbul ignore next */
      throw new Error('Error - UTXOSet.buildBaseTx: outputID does not '
      + `implement AmountOutput: ${outputID}`);
    }

    if (!amount.eq(zero)) {
      const sndout:AmountOutput = SelectOutputClass(outputID,
        amount,
        locktime,
        threshold,
        toAddresses) as AmountOutput;
      const mainXferout:TransferableOutput = new TransferableOutput(assetID, sndout);
      outs.push(mainXferout);
      for (let i = 0; i < utxos.length && spendamount.lt(amount); i++) {
        if (
          utxos[i].getOutput() instanceof AmountOutput
                    && (
                      assetID === undefined
                        || utxos[i].getAssetID().compare(assetID) === 0
                    )
                    && utxos[i].getOutput().meetsThreshold(fromAddresses, asOf)
        ) {
          const output:AmountOutput = utxos[i].getOutput() as AmountOutput;
          const amt:BN = output.getAmount().clone();
          spendamount = spendamount.add(amt);
          change = spendamount.sub(amount);
          change = change.gt(zero) ? change : zero.clone();

          const txid:Buffer = utxos[i].getTxID();
          const outputidx:Buffer = utxos[i].getOutputIdx();
          const input:SecpInput = new SecpInput(amt);
          const xferin:TransferableInput = new TransferableInput(txid, outputidx, assetID, input);
          const spenders:Array<Buffer> = output.getSpenders(fromAddresses, asOf);
          for (let j = 0; j < spenders.length; j++) {
            const idx:number = output.getAddressIdx(spenders[j]);
            if (idx === -1) {
              /* istanbul ignore next */
              throw new Error('Error - UTXOSet.buildBaseTx: no such '
              + `address in output: ${spenders[j]}`);
            }
            xferin.getInput().addSignatureIdx(idx, spenders[j]);
          }
          ins.push(xferin);

          if (change.gt(zero)) {
            if (assetID) {
              const changeout:AmountOutput = SelectOutputClass(outputID,
                change, zero.clone(),
                1, changeAddresses) as AmountOutput;
              const xferout:TransferableOutput = new TransferableOutput(assetID, changeout);
              outs.push(xferout);
            }
            break;
          }
          /* istanbul ignore next */
          if (spendamount.gte(amount)) {
            break;
          }
        }
      }

      if (spendamount.lt(amount)) {
        /* istanbul ignore next */
        throw new Error('Error - UTXOSet.buildBaseTx: insufficient'
        + 'funds to create the transaction');
      }
    }
    const baseTx:BaseTx = new BaseTx(networkid, blockchainid, outs, ins);
    return new UnsignedTx(baseTx);
  };

  /**
     * Creates an unsigned transaction. For more granular control, you may create your own
     * [[TxCreateAsset]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s).
     *
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param fee The amount of AVA to be paid for fees, in $nAVA
     * @param feeSenderAddresses The addresses to send the fees
     * @param initialState The [[InitialStates]]that represent the intial state of a created asset
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVA = 10^9 $nAVA
     *
     * @returns An unsigned transaction created from the passed in parameters.
     *
     */
  buildCreateAssetTx = (
    networkid:number, blockchainid:Buffer, avaAssetID:Buffer,
    fee:BN, feeSenderAddresses:Array<Buffer>,
    initialState:InitialStates, name:string,
    symbol:string, denomination:number,
  ):UnsignedTx => {
    // Cheating and using buildBaseTx to get Ins and Outs for fees.
    // Fees are burned, so no toAddresses, only fromAddresses and changeAddresses, both are the feeSenderAddresses
    const utx:UnsignedTx = this.buildBaseTx(networkid,
      blockchainid, fee,
      [], feeSenderAddresses,
      feeSenderAddresses, avaAssetID);
    const ins:Array<TransferableInput> = utx.getTransaction().getIns();
    const outs:Array<TransferableOutput> = utx.getTransaction().getOuts();
    const CAtx:CreateAssetTx = new CreateAssetTx(networkid,
      blockchainid,
      outs, ins,
      name, symbol,
      denomination,
      initialState);
    return new UnsignedTx(CAtx);
  };

  /**
     * Creates an unsigned NFT transfer transaction. For more granular control, you may create your own
     * [[NFTTransferOperation]] manually (with their corresponding [[TransferableInput]]s, [[TransferableOutput]]s, and [[TransferOperation]]s).
     *
     * @param networkid The number representing NetworkID of the node
     * @param blockchainid The {@link https://github.com/feross/buffer|Buffer} representing the BlockchainID for the transaction
     * @param feeAssetID The assetID for the AVA fee to be paid
     * @param fee The amount of AVA to be paid for fees, in $nAVA
     * @param feeSenderAddresses The addresses to send the fees
     * @param toAddresses An array of {@link https://github.com/feross/buffer|Buffer}s which indicate who recieves the NFT
     * @param fromAddresses An array for {@link https://github.com/feross/buffer|Buffer} who owns the NFT
     * @param utxoids An array of strings for the NFTs being transferred
     * @param asOf Optional. The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     * @param locktime Optional. The locktime field created in the resulting outputs
     * @param threshold Optional. The number of signatures required to spend the funds in the resultant UTXO
     * @returns An unsigned transaction created from the passed in parameters.
     *
     */
  buildNFTTransferTx = (
    networkid:number, blockchainid:Buffer, feeAssetID:Buffer, fee:BN,
    feeSenderAddresses:Array<Buffer>, toAddresses:Array<Buffer>, fromAddresses:Array<Buffer>,
    utxoids:Array<string>, asOf:BN = UnixNow(),
    locktime:BN = new BN(0), threshold:number = 1,
  ):UnsignedTx => {
    // Cheating and using buildBaseTx to get Ins and Outs for fees.
    // Fees are burned, so no toAddresses, only feeSenderAddresses and changeAddresses, both are the feeSenderAddresses
    const utx:UnsignedTx = this.buildBaseTx(
      networkid, blockchainid, fee, [], feeSenderAddresses, feeSenderAddresses, feeAssetID,
    );
    const ins:Array<TransferableInput> = utx.getTransaction().getIns();
    const outs:Array<TransferableOutput> = utx.getTransaction().getOuts();
    const ops:Array<TransferableOperation> = [];
    for (let i:number = 0; i < utxoids.length; i++) {
      const utxo:UTXO = this.getUTXO(utxoids[i]);

      const out:NFTTransferOutput = utxo.getOutput() as NFTTransferOutput;
      const spenders:Array<Buffer> = out.getSpenders(fromAddresses, asOf);

      const outbound:NFTTransferOutput = new NFTTransferOutput(
        out.getGroupID(), out.getPayload(), locktime, threshold, toAddresses,
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
    const OpTx:OperationTx = new OperationTx(networkid, blockchainid, outs, ins, ops);
    return new UnsignedTx(OpTx);
  };

  /**
     * Returns a new set with copy of UTXOs in this and set parameter.
     *
     * @param utxoset The [[UTXOSet]] to merge with this one
     * @param hasUTXOIDs Will subselect a set of [[UTXO]]s which have the UTXOIDs provided in this array, defults to all UTXOs
     *
     * @returns A new UTXOSet that contains all the filtered elements.
     */
  merge = (utxoset:UTXOSet, hasUTXOIDs:Array<string> = undefined): UTXOSet => {
    const results:UTXOSet = new UTXOSet();
    const utxos1:Array<UTXO> = this.getAllUTXOs(hasUTXOIDs);
    const utxos2:Array<UTXO> = utxoset.getAllUTXOs(hasUTXOIDs);
    const process = (utxo:UTXO) => {
      results.add(utxo);
    };
    utxos1.forEach(process);
    utxos2.forEach(process);
    return results;
  };

  /**
     * Set intersetion between this set and a parameter.
     *
     * @param utxoset The set to intersect
     *
     * @returns A new UTXOSet containing the intersection
     */
  intersection = (utxoset:UTXOSet):UTXOSet => {
    const us1:Array<string> = this.getUTXOIDs();
    const us2:Array<string> = utxoset.getUTXOIDs();
    const results:Array<string> = us1.filter((utxoid) => us2.includes(utxoid));
    return this.merge(utxoset, results);
  };

  /**
     * Set difference between this set and a parameter.
     *
     * @param utxoset The set to difference
     *
     * @returns A new UTXOSet containing the difference
     */
  difference = (utxoset:UTXOSet):UTXOSet => {
    const us1:Array<string> = this.getUTXOIDs();
    const us2:Array<string> = utxoset.getUTXOIDs();
    const results:Array<string> = us1.filter((utxoid) => !us2.includes(utxoid));
    return this.merge(utxoset, results);
  };

  /**
     * Set symmetrical difference between this set and a parameter.
     *
     * @param utxoset The set to symmetrical difference
     *
     * @returns A new UTXOSet containing the symmetrical difference
     */
  symDifference = (utxoset:UTXOSet):UTXOSet => {
    const us1:Array<string> = this.getUTXOIDs();
    const us2:Array<string> = utxoset.getUTXOIDs();
    const results:Array<string> = us1.filter((utxoid) => !us2.includes(utxoid))
      .concat(us2.filter((utxoid) => !us1.includes(utxoid)));
    return this.merge(utxoset, results);
  };

  /**
     * Set union between this set and a parameter.
     *
     * @param utxoset The set to union
     *
     * @returns A new UTXOSet containing the union
     */
  union = (utxoset:UTXOSet):UTXOSet => this.merge(utxoset);

  /**
     * Merges a set by the rule provided.
     *
     * @param utxoset The set to merge by the MergeRule
     * @param mergeRule The [[MergeRule]] to apply
     *
     * @returns A new UTXOSet containing the merged data
     *
     * @remarks
     * The merge rules are as follows:
     *   * "intersection" - the intersection of the set
     *   * "differenceSelf" - the difference between the existing data and new set
     *   * "differenceNew" - the difference between the new data and the existing set
     *   * "symDifference" - the union of the differences between both sets of data
     *   * "union" - the unique set of all elements contained in both sets
     *   * "unionMinusNew" - the unique set of all elements contained in both sets, excluding values only found in the new set
     *   * "unionMinusSelf" - the unique set of all elements contained in both sets, excluding values only found in the existing set
     */
  mergeByRule = (utxoset:UTXOSet, mergeRule:MergeRule):UTXOSet => {
    let uSet:UTXOSet;
    switch (mergeRule) {
      case 'intersection':
        return this.intersection(utxoset);
      case 'differenceSelf':
        return this.difference(utxoset);
      case 'differenceNew':
        return utxoset.difference(this);
      case 'symDifference':
        return this.symDifference(utxoset);
      case 'union':
        return this.union(utxoset);
      case 'unionMinusNew':
        uSet = this.union(utxoset);
        return uSet.difference(utxoset);
      case 'unionMinusSelf':
        uSet = this.union(utxoset);
        return uSet.difference(this);
      default:
        throw new Error(`Error - UTXOSet.mergeByRule: bad MergeRule - ${mergeRule}`);
    }
  };
}
