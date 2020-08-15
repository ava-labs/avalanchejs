/**
 * @packageDocumentation
 * @module Common-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../utils/bintools';
import BN from "bn.js";
import { Output, BaseAmountOutput } from './output';
import { UnixNow } from '../utils/helperfunctions';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Rules used when merging sets
 */
export type MergeRule = 'intersection' // Self INTERSECT New
| 'differenceSelf' // Self MINUS New
| 'differenceNew' // New MINUS Self
| 'symDifference' // differenceSelf UNION differenceNew
| 'union' // Self UNION New
| 'unionMinusNew' // union MINUS differenceNew
| 'unionMinusSelf' // union MINUS differenceSelf
| 'ERROR'; // generate error for testing


/**
 * Class for representing a single StandardUTXO.
 */
export class StandardUTXO {
  protected codecid:Buffer = Buffer.alloc(2);

  protected txid:Buffer = Buffer.alloc(32);

  protected outputidx:Buffer = Buffer.alloc(4);

  protected assetid:Buffer = Buffer.alloc(32);

  protected output:Output = undefined;

  /**
     * Returns the numeric representation of the CodecID.
     */
  getCodecID = ()
  /* istanbul ignore next */
  :number => this.codecid.readUInt8(0);

  /**
   * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
    */
   getCodecIDBuffer = ():Buffer => this.codecid;

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
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[StandardUTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
     *
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[StandardUTXO]]
     */
  fromBuffer:(bytes:Buffer, offset?:number) => number;

  /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardUTXO]].
     */
  toBuffer():Buffer {
    const outbuff:Buffer = this.output.toBuffer();
    const outputidbuffer:Buffer = Buffer.alloc(4);
    outputidbuffer.writeUInt32BE(this.output.getOutputID(), 0);
    const barr:Array<Buffer> = [this.codecid, this.txid, this.outputidx, this.assetid, outputidbuffer, outbuff];
    return Buffer.concat(barr, 
      this.codecid.length + this.txid.length 
      + this.outputidx.length + this.assetid.length
      + outputidbuffer.length + outbuff.length);
  }

  /**
     * Takes a base-58 string containing an [[StandardUTXO]], parses it, populates the class, and returns the length of the StandardUTXO in bytes.
     *
     * @param serialized A base-58 string containing a raw [[StandardUTXO]]
     *
     * @returns The length of the raw [[StandardUTXO]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
  fromString(serialized:string) {
    /* istanbul ignore next */
    return this.fromBuffer(bintools.cb58Decode(serialized));
  }

  /**
     * Returns a base-58 representation of the [[StandardUTXO]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
  toString():string {
    /* istanbul ignore next */
    return bintools.cb58Encode(this.toBuffer());
  }

  /**
     * Class for representing a single StandardUTXO.
     *
     * @param codecID Optional number which specifies the codeID of the UTXO. Default 1
     * @param txid Optional {@link https://github.com/feross/buffer|Buffer} of transaction ID for the StandardUTXO
     * @param txidx Optional {@link https://github.com/feross/buffer|Buffer} or number for the index of the transaction's [[Output]]
     * @param assetid Optional {@link https://github.com/feross/buffer|Buffer} of the asset ID for the StandardUTXO
     * @param outputid Optional {@link https://github.com/feross/buffer|Buffer} or number of the output ID for the StandardUTXO
     */
  constructor(codecID:number = 0, txid:Buffer = undefined,
    outputidx:Buffer | number = undefined,
    assetid:Buffer = undefined,
    output:Output = undefined) {
    if (typeof codecID !== 'undefined' && typeof txid !== 'undefined'
    && typeof outputidx !== 'undefined'
    && typeof assetid !== 'undefined'
    && typeof output !== 'undefined') {
      this.codecid .writeUInt8(codecID, 0);
      this.txid = txid;
      if (typeof outputidx === 'number') {
        this.outputidx.writeUInt32BE(outputidx, 0);
      } else if (outputidx instanceof Buffer) {
        this.outputidx = outputidx;
      } else {
        /* istanbul ignore next */
        throw new Error('Error - StandardUTXO.constructor: outputidx parameter is not a '
        + `number or a Buffer: ${outputidx}`);
      }

      this.assetid = assetid;
      this.output = output;
    }
  }
}

/**
 * Class representing a set of [[StandardUTXO]]s.
 */
export class StandardUTXOSet {
  protected utxos:{[utxoid: string]: StandardUTXO } = {};

  protected addressUTXOs:{[address: string]: {[utxoid: string]: BN}} = {}; // maps address to utxoids:locktime

  /**
     * Returns true if the [[StandardUTXO]] is in the StandardUTXOSet.
     *
     * @param utxo Either a [[StandardUTXO]] a cb58 serialized string representing a StandardUTXO
     */
  includes = (utxo:StandardUTXO | string):boolean => {
    const utxoX:StandardUTXO = new StandardUTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxoX.fromBuffer(bintools.cb58Decode(utxo));
    } else {
      utxoX.fromBuffer(utxo.toBuffer()); // forces a copy
    }
    const utxoid:string = utxoX.getUTXOID();
    return (utxoid in this.utxos);
  };

  /**
     * Adds a [[StandardUTXO]] to the StandardUTXOSet.
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns A [[StandardUTXO]] if one was added and undefined if nothing was added.
     */
  add = (utxo:StandardUTXO | string, overwrite:boolean = false):StandardUTXO => {
    const utxovar:StandardUTXO = new StandardUTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxovar.fromBuffer(bintools.cb58Decode(utxo));
    } else if (utxo instanceof StandardUTXO) {
      utxovar.fromBuffer(utxo.toBuffer()); // forces a copy
    } else {
      /* istanbul ignore next */
      throw new Error(`Error - StandardUTXOSet.add: utxo parameter is not a UTXO or string: ${utxo}`);
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
     * Adds an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns An array of StandardUTXOs which were added.
     */
  addArray = (utxos:Array<string | StandardUTXO>, overwrite:boolean = false):Array<StandardUTXO> => {
    const added:Array<StandardUTXO> = [];
    for (let i = 0; i < utxos.length; i++) {
      const result:StandardUTXO = this.add(utxos[i], overwrite);
      if (typeof result !== 'undefined') {
        added.push(result);
      }
    }
    return added;
  };

  /**
     * Removes a [[StandardUTXO]] from the [[StandardUTXOSet]] if it exists.
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     *
     * @returns A [[StandardUTXO]] if it was removed and undefined if nothing was removed.
     */
  remove = (utxo:StandardUTXO | string):StandardUTXO => {
    const utxovar:StandardUTXO = new StandardUTXO();
    // force a copy
    if (typeof utxo === 'string') {
      utxovar.fromBuffer(bintools.cb58Decode(utxo));
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
     * Removes an array of [[StandardUTXO]]s to the [[StandardUTXOSet]].
     *
     * @param utxo Either a [[StandardUTXO]] an cb58 serialized string representing a StandardUTXO
     * @param overwrite If true, if the UTXOID already exists, overwrite it... default false
     *
     * @returns An array of UTXOs which were removed.
     */
  removeArray = (utxos:Array<string | StandardUTXO>):Array<StandardUTXO> => {
    const removed:Array<StandardUTXO> = [];
    for (let i = 0; i < utxos.length; i++) {
      const result:StandardUTXO = this.remove(utxos[i]);
      if (typeof result !== 'undefined') {
        removed.push(result);
      }
    }
    return removed;
  };

  /**
     * Gets a [[StandardUTXO]] from the [[StandardUTXOSet]] by its UTXOID.
     *
     * @param utxoid String representing the UTXOID
     *
     * @returns A [[StandardUTXO]] if it exists in the set.
     */
  getUTXO = (utxoid:string):StandardUTXO => this.utxos[utxoid];

  /**
     * Gets all the [[StandardUTXO]]s, optionally that match with UTXOIDs in an array
     *
     * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
     *
     * @returns An array of [[StandardUTXO]]s.
     */
  getAllUTXOs = (utxoids:Array<string> = undefined):Array<StandardUTXO> => {
    let results:Array<StandardUTXO> = [];
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
     * Gets all the [[StandardUTXO]]s as strings, optionally that match with UTXOIDs in an array.
     *
     * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
     *
     * @returns An array of [[StandardUTXO]]s as cb58 serialized strings.
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
     * Gets the addresses in the [[StandardUTXOSet]] and returns an array of {@link https://github.com/feross/buffer|Buffer}.
     */
  getAddresses = ():Array<Buffer> => Object.keys(this.addressUTXOs)
    .map((k) => Buffer.from(k, 'hex'));

  /**
     * Returns the balance of a set of addresses in the StandardUTXOSet.
     *
     * @param addresses An array of addresses
     * @param assetID Either a {@link https://github.com/feross/buffer|Buffer} or an cb58 serialized representation of an AssetID
     * @param asOf The timestamp to verify the transaction against as a {@link https://github.com/indutny/bn.js/|BN}
     *
     * @returns Returns the total balance as a {@link https://github.com/indutny/bn.js/|BN}.
     */
  getBalance = (addresses:Array<Buffer>, assetID:Buffer|string, asOf:BN = undefined):BN => {
    const utxoids:Array<string> = this.getUTXOIDs(addresses);
    const utxos:Array<StandardUTXO> = this.getAllUTXOs(utxoids);
    let spend:BN = new BN(0);
    let asset:Buffer;
    if (typeof assetID === 'string') {
      asset = bintools.cb58Decode(assetID);
    } else {
      asset = assetID;
    }
    for (let i = 0; i < utxos.length; i++) {
      if (utxos[i].getOutput() instanceof BaseAmountOutput
      && utxos[i].getAssetID().toString('hex') === asset.toString('hex')
      && utxos[i].getOutput().meetsThreshold(addresses, asOf)) {
        spend = spend.add((utxos[i].getOutput() as BaseAmountOutput).getAmount());
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
     * Returns a new set with copy of UTXOs in this and set parameter.
     *
     * @param utxoset The [[StandardUTXOSet]] to merge with this one
     * @param hasUTXOIDs Will subselect a set of [[StandardUTXO]]s which have the UTXOIDs provided in this array, defults to all UTXOs
     *
     * @returns A new StandardUTXOSet that contains all the filtered elements.
     */
  merge = (utxoset:StandardUTXOSet, hasUTXOIDs:Array<string> = undefined): StandardUTXOSet => {
    const results:StandardUTXOSet = new StandardUTXOSet();
    const utxos1:Array<StandardUTXO> = this.getAllUTXOs(hasUTXOIDs);
    const utxos2:Array<StandardUTXO> = utxoset.getAllUTXOs(hasUTXOIDs);
    const process = (utxo:StandardUTXO) => {
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
     * @returns A new StandardUTXOSet containing the intersection
     */
  intersection = (utxoset:StandardUTXOSet):StandardUTXOSet => {
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
     * @returns A new StandardUTXOSet containing the difference
     */
  difference = (utxoset:StandardUTXOSet):StandardUTXOSet => {
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
     * @returns A new StandardUTXOSet containing the symmetrical difference
     */
  symDifference = (utxoset:StandardUTXOSet):StandardUTXOSet => {
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
     * @returns A new StandardUTXOSet containing the union
     */
  union = (utxoset:StandardUTXOSet):StandardUTXOSet => this.merge(utxoset);

  /**
     * Merges a set by the rule provided.
     *
     * @param utxoset The set to merge by the MergeRule
     * @param mergeRule The [[MergeRule]] to apply
     *
     * @returns A new StandardUTXOSet containing the merged data
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
  mergeByRule = (utxoset:StandardUTXOSet, mergeRule:MergeRule):StandardUTXOSet => {
    let uSet:StandardUTXOSet;
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
        throw new Error(`Error - StandardUTXOSet.mergeByRule: bad MergeRule - ${mergeRule}`);
    }
  };
}
