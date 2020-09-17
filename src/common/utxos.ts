/**
 * @packageDocumentation
 * @module Common-UTXOs
 */
import { Buffer } from 'buffer/';
import BinTools from '../utils/bintools';
import BN from "bn.js";
import { Output, StandardAmountOutput } from './output';
import { UnixNow } from '../utils/helperfunctions';
import { MergeRule } from '../utils/constants';
import { Serializable, Serialization, SerializedEncoding } from '../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

/**
 * Class for representing a single StandardUTXO.
 */
export abstract class StandardUTXO extends Serializable{
  protected _typeName = "StandardUTXO";
  protected _typeID = undefined;

  serialize(encoding:SerializedEncoding = "hex"):object {
    let fields:object = super.serialize(encoding);
    return {
      ...fields,
      "codecid": serializer.encoder(this.codecid, encoding, "Buffer", "decimalString"),
      "txid": serializer.encoder(this.txid, encoding, "Buffer", "cb58"),
      "outputidx": serializer.encoder(this.outputidx, encoding, "Buffer", "decimalString"),
      "assetid": serializer.encoder(this.assetid, encoding, "Buffer", "cb58"),
      "output": this.output.serialize(encoding)
    }
  };
  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.codecid = serializer.decoder(fields["codecid"], encoding, "decimalString", "Buffer", 2);
    this.txid = serializer.decoder(fields["txid"], encoding, "cb58", "Buffer", 32);
    this.outputidx = serializer.decoder(fields["outputidx"], encoding, "decimalString", "Buffer", 4);
    this.assetid = serializer.decoder(fields["assetid"], encoding, "cb58", "Buffer", 32);
  }

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
  abstract fromBuffer(bytes:Buffer, offset?:number):number;

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

  abstract fromString(serialized:string):number;

  abstract toString():string;

  abstract clone():this;

  abstract create(codecID?:number, txid?:Buffer,
    outputidx?:Buffer | number,
    assetid?:Buffer,
    output?:Output):this;

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
    output:Output = undefined){
    super();
    if (typeof codecID !== 'undefined') {
      this.codecid .writeUInt8(codecID, 0);
    }
    if(typeof txid !== 'undefined') {
      this.txid = txid;
    }
    if (typeof outputidx === 'number') {
      this.outputidx.writeUInt32BE(outputidx, 0);
    } else if (outputidx instanceof Buffer) {
      this.outputidx = outputidx;
    } 

    if(typeof assetid !== 'undefined') {
      this.assetid = assetid;
    }
    if(typeof output !== 'undefined') {
      this.output = output;
    }
      
  }
}
/**
 * Class representing a set of [[StandardUTXO]]s.
 */
export abstract class StandardUTXOSet<UTXOClass extends StandardUTXO> extends Serializable{
  protected _typeName = "StandardUTXOSet";
  protected _typeID = undefined;

  serialize(encoding:SerializedEncoding = "hex"):object {
    let fields:object = super.serialize(encoding);
    let utxos = {};
    for(let utxoid in this.utxos) {
      let utxoidCleaned:string = serializer.encoder(utxoid, encoding, "base58", "base58");
      utxos[utxoidCleaned] = this.utxos[utxoid].serialize(encoding);
    }
    let addressUTXOs = {};
    for(let address in this.addressUTXOs) {
      let addressCleaned:string = serializer.encoder(address, encoding, "hex", "cb58");
      let utxobalance = {};
      for(let utxoid in this.addressUTXOs[address]){
        let utxoidCleaned:string = serializer.encoder(utxoid, encoding, "base58", "base58");
        utxobalance[utxoidCleaned] = serializer.encoder(this.addressUTXOs[address][utxoid], encoding, "BN", "decimalString");
      }
      addressUTXOs[addressCleaned] = utxobalance;
    }
    return {
      ...fields,
      utxos,
      addressUTXOs
    }
  };

  protected utxos:{[utxoid: string]: UTXOClass } = {};
  protected addressUTXOs:{[address: string]: {[utxoid: string]: BN}} = {}; // maps address to utxoids:locktime

  abstract parseUTXO(utxo:UTXOClass | string):UTXOClass;

  /**
   * Returns true if the [[StandardUTXO]] is in the StandardUTXOSet.
   *
   * @param utxo Either a [[StandardUTXO]] a cb58 serialized string representing a StandardUTXO
   */
  includes = (utxo:UTXOClass | string):boolean => {
    let utxoX:UTXOClass = undefined;
    let utxoid:string = undefined;
    try {
      utxoX = this.parseUTXO(utxo);
      utxoid = utxoX.getUTXOID();
    } catch(e) {
      if(e instanceof Error){
        console.log(e.message);
      } else{ 
        console.log(e);
      }
      return false;
    }
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
  add(utxo:UTXOClass | string, overwrite:boolean = false):UTXOClass {
    let utxovar:UTXOClass = undefined;
    try {
      utxovar = this.parseUTXO(utxo);
    } catch(e) {
      if(e instanceof Error){
        console.log(e.message);
      } else{ 
        console.log(e);
      }
      return undefined; 
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
  addArray(utxos:Array<string | UTXOClass>, overwrite:boolean = false):Array<StandardUTXO> {
    const added:Array<UTXOClass> = [];
    for (let i = 0; i < utxos.length; i++) {
      let result:UTXOClass = this.add(utxos[i], overwrite);
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
  remove = (utxo:UTXOClass | string):UTXOClass => {
    let utxovar:UTXOClass = undefined;
    try {
      utxovar = this.parseUTXO(utxo);
    } catch(e) {
      if(e instanceof Error){
        console.log(e.message);
      } else{ 
        console.log(e);
      }
      return undefined; 
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
  removeArray = (utxos:Array<string | UTXOClass>):Array<UTXOClass> => {
    const removed:Array<UTXOClass> = [];
    for (let i = 0; i < utxos.length; i++) {
      const result:UTXOClass = this.remove(utxos[i]);
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
  getUTXO = (utxoid:string):UTXOClass => this.utxos[utxoid];

  /**
     * Gets all the [[StandardUTXO]]s, optionally that match with UTXOIDs in an array
     *
     * @param utxoids An optional array of UTXOIDs, returns all [[StandardUTXO]]s if not provided
     *
     * @returns An array of [[StandardUTXO]]s.
     */
  getAllUTXOs = (utxoids:Array<string> = undefined):Array<UTXOClass> => {
    let results:Array<UTXOClass> = [];
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
      if (utxos[i].getOutput() instanceof StandardAmountOutput
      && utxos[i].getAssetID().toString('hex') === asset.toString('hex')
      && utxos[i].getOutput().meetsThreshold(addresses, asOf)) {
        spend = spend.add((utxos[i].getOutput() as StandardAmountOutput).getAmount());
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

  abstract clone():this;

  abstract create(...args:any[]):this;

  filter(args:any[], lambda:(utxo:UTXOClass, ...largs:any[]) => boolean):this {
    let newset:this = this.clone();
    let utxos:Array<UTXOClass> = this.getAllUTXOs();
    for(let i = 0; i < utxos.length; i++){
      if(lambda(utxos[i], ...args) === false) {
        newset.remove(utxos[i]);
      }
    }
    return newset;
  }

  /**
     * Returns a new set with copy of UTXOs in this and set parameter.
     *
     * @param utxoset The [[StandardUTXOSet]] to merge with this one
     * @param hasUTXOIDs Will subselect a set of [[StandardUTXO]]s which have the UTXOIDs provided in this array, defults to all UTXOs
     *
     * @returns A new StandardUTXOSet that contains all the filtered elements.
     */
  merge = (utxoset:this, hasUTXOIDs:Array<string> = undefined):this => {
    const results:this = this.create();
    const utxos1:Array<UTXOClass> = this.getAllUTXOs(hasUTXOIDs);
    const utxos2:Array<UTXOClass> = utxoset.getAllUTXOs(hasUTXOIDs);
    const process = (utxo:UTXOClass) => {
      results.add(utxo);
    };
    utxos1.forEach(process);
    utxos2.forEach(process);
    return results as this;
  };

  /**
     * Set intersetion between this set and a parameter.
     *
     * @param utxoset The set to intersect
     *
     * @returns A new StandardUTXOSet containing the intersection
     */
  intersection = (utxoset:this):this => {
    const us1:Array<string> = this.getUTXOIDs();
    const us2:Array<string> = utxoset.getUTXOIDs();
    const results:Array<string> = us1.filter((utxoid) => us2.includes(utxoid));
    return this.merge(utxoset, results) as this;
  };

  /**
     * Set difference between this set and a parameter.
     *
     * @param utxoset The set to difference
     *
     * @returns A new StandardUTXOSet containing the difference
     */
  difference = (utxoset:this):this => {
    const us1:Array<string> = this.getUTXOIDs();
    const us2:Array<string> = utxoset.getUTXOIDs();
    const results:Array<string> = us1.filter((utxoid) => !us2.includes(utxoid));
    return this.merge(utxoset, results) as this;
  };

  /**
     * Set symmetrical difference between this set and a parameter.
     *
     * @param utxoset The set to symmetrical difference
     *
     * @returns A new StandardUTXOSet containing the symmetrical difference
     */
  symDifference = (utxoset:this):this => {
    const us1:Array<string> = this.getUTXOIDs();
    const us2:Array<string> = utxoset.getUTXOIDs();
    const results:Array<string> = us1.filter((utxoid) => !us2.includes(utxoid))
      .concat(us2.filter((utxoid) => !us1.includes(utxoid)));
    return this.merge(utxoset, results) as this;
  };

  /**
     * Set union between this set and a parameter.
     *
     * @param utxoset The set to union
     *
     * @returns A new StandardUTXOSet containing the union
     */
  union = (utxoset:this):this => this.merge(utxoset) as this;

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
  mergeByRule = (utxoset:this, mergeRule:MergeRule):this => {
    let uSet:this;
    switch (mergeRule) {
      case 'intersection':
        return this.intersection(utxoset);
      case 'differenceSelf':
        return this.difference(utxoset);
      case 'differenceNew':
        return utxoset.difference(this) as this;
      case 'symDifference':
        return this.symDifference(utxoset);
      case 'union':
        return this.union(utxoset);
      case 'unionMinusNew':
        uSet = this.union(utxoset);
        return uSet.difference(utxoset) as this;
      case 'unionMinusSelf':
        uSet = this.union(utxoset);
        return uSet.difference(this) as this;
      default:
        throw new Error(`Error - StandardUTXOSet.mergeByRule: bad MergeRule - ${mergeRule}`);
    }
  };
}
