/**
 * @packageDocumentation
 * @module Common-Transactions
 */
import { Buffer } from 'buffer/';
import BinTools from '../utils/bintools';
import { Credential } from './credentials';
import BN from 'bn.js';
import { KeyChain, KeyPair } from '../keychains/keychain';
import { StandardAmountInput, StandardTransferableInput } from './input';
import { StandardAmountOutput, StandardTransferableOutput } from './output';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Class representing a base for all transactions.
 */
export abstract class StandardBaseTx<KPClass extends KeyPair, KCClass extends KeyChain<KPClass>> {
  protected networkid:Buffer = Buffer.alloc(4);
  protected blockchainid:Buffer = Buffer.alloc(32);
  protected numouts:Buffer = Buffer.alloc(4);
  protected outs:Array<StandardTransferableOutput>;
  protected numins:Buffer = Buffer.alloc(4);
  protected ins:Array<StandardTransferableInput>;
  protected memo:Buffer = Buffer.alloc(4);

  /**
     * Returns the id of the [[StandardBaseTx]]
     */
  abstract getTxType:() => number;

  /**
     * Returns the NetworkID as a number
     */
  getNetworkID = ():number => this.networkid.readUInt32BE(0);

  /**
     * Returns the Buffer representation of the BlockchainID
     */
  getBlockchainID = ():Buffer => this.blockchainid;

  /**
     * Returns the array of [[TransferableInput]]s
     */
  getIns = ():Array<StandardTransferableInput> => this.ins;

  /**
     * Returns the array of [[TransferableOutput]]s
     */
  getOuts = ():Array<StandardTransferableOutput> => this.outs;

  /**
   * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the memo 
   */
  getMemo = ():Buffer => this.memo;

  /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardBaseTx]].
     */
  toBuffer():Buffer {
    this.outs.sort(StandardTransferableOutput.comparator());
    this.ins.sort(StandardTransferableInput.comparator());
    this.numouts.writeUInt32BE(this.outs.length, 0);
    this.numins.writeUInt32BE(this.ins.length, 0);
    let bsize:number = this.networkid.length + this.blockchainid.length + this.numouts.length;
    const barr:Array<Buffer> = [this.networkid, this.blockchainid, this.numouts];
    for (let i = 0; i < this.outs.length; i++) {
      const b:Buffer = this.outs[i].toBuffer();
      barr.push(b);
      bsize += b.length;
    }
    barr.push(this.numins);
    bsize += this.numins.length;
    for (let i = 0; i < this.ins.length; i++) {
      const b:Buffer = this.ins[i].toBuffer();
      barr.push(b);
      bsize += b.length;
    }
    let memolen:Buffer = Buffer.alloc(4);
    memolen.writeUInt32BE(this.memo.length, 0);
    barr.push(memolen);
    bsize += 4;
    barr.push(this.memo);
    bsize += this.memo.length;
    const buff:Buffer = Buffer.concat(barr, bsize);
    return buff;
  }

  /**
     * Returns a base-58 representation of the [[StandardBaseTx]].
     */
  toString():string {
    return bintools.bufferToB58(this.toBuffer());
  }

  /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     *
     * @param msg A Buffer for the [[UnsignedTx]]
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns An array of [[Credential]]s
     */
  abstract sign(msg:Buffer, kc:KeyChain<KPClass>):Array<Credential>;

  /**
     * Class representing a StandardBaseTx which is the foundation for all transactions.
     *
     * @param networkid Optional networkid, default 3
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
     */
  constructor(networkid:number = 3, blockchainid:Buffer = Buffer.alloc(32, 16), outs:Array<StandardTransferableOutput> = undefined, ins:Array<StandardTransferableInput> = undefined, memo:Buffer = undefined) {
    this.networkid.writeUInt32BE(networkid, 0);
    this.blockchainid = blockchainid;
    if(typeof memo === "undefined"){
      this.memo = Buffer.alloc(4);
      this.memo.writeUInt32BE(0,0);
    } else {
      let memolen = Buffer.alloc(4)
      memolen.writeUInt32BE(memo.length, 0);
      this.memo = memo;
    }
    
    if (typeof ins !== 'undefined' && typeof outs !== 'undefined') {
      this.numouts.writeUInt32BE(outs.length, 0);
      this.outs = outs.sort(StandardTransferableOutput.comparator());
      this.numins.writeUInt32BE(ins.length, 0);
      this.ins = ins.sort(StandardTransferableInput.comparator());
    }
  }
}



/**
 * Class representing an unsigned transaction.
 */
export abstract class StandardUnsignedTx<KPClass extends KeyPair, 
KCClass extends KeyChain<KPClass>, 
SBTx extends StandardBaseTx<KPClass, KCClass>
> {
  protected codecid:number = 0;
  protected transaction:SBTx;

  /**
     * Returns the CodecID as a number
     */
    getCodecID = ():number => this.codecid;

    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the CodecID
      */
     getCodecIDBuffer = ():Buffer => {
       let codecBuf:Buffer = Buffer.alloc(2);
       codecBuf.writeUInt16BE(this.codecid, 0);
       return codecBuf;
     } 

  /**
     * Returns the inputTotal as a BN 
     */
  getInputTotal = (assetID:Buffer):BN=> {
    const ins:Array<StandardTransferableInput> = this.getTransaction().getIns();
    const aIDHex:string = assetID.toString('hex');
    let total:BN = new BN(0);

    for(let i:number = 0; i < ins.length; i++){
       

      // only check StandardAmountInputs
      if(ins[i].getInput() instanceof StandardAmountInput && aIDHex === ins[i].getAssetID().toString('hex')) {
        const input = ins[i].getInput() as StandardAmountInput;
        total = total.add(input.getAmount());
      }
    }
    return total;
  }

  /**
     * Returns the outputTotal as a BN
     */
  getOutputTotal = (assetID:Buffer):BN => {
    const outs:Array<StandardTransferableOutput> = this.getTransaction().getOuts();
    const aIDHex:string = assetID.toString('hex');
    let total:BN = new BN(0);

    for(let i:number = 0; i < outs.length; i++){

      // only check StandardAmountOutput
      if(outs[i].getOutput() instanceof StandardAmountOutput && aIDHex === outs[i].getAssetID().toString('hex')) {
        const output:StandardAmountOutput = outs[i].getOutput() as StandardAmountOutput;
        total = total.add(output.getAmount());
      }
    }
    return total;
  }

  /**
     * Returns the number of burned tokens as a BN
     */
  getBurn = (assetID:Buffer):BN => {
    return this.getInputTotal(assetID).sub(this.getOutputTotal(assetID));
  }

  /**
     * Returns the Transaction
     */
  getTransaction = ():SBTx => this.transaction;

  abstract fromBuffer(bytes:Buffer, offset?:number):number;

  toBuffer():Buffer {
    const codecid:Buffer = this.getCodecIDBuffer();
    const txtype:Buffer = Buffer.alloc(4);
    txtype.writeUInt32BE(this.transaction.getTxType(), 0);
    const basebuff = this.transaction.toBuffer();
    return Buffer.concat([codecid, txtype, basebuff], codecid.length + txtype.length + basebuff.length);
  }

  /**
     * Signs this [[UnsignedTx]] and returns signed [[StandardTx]]
     *
     * @param kc An [[KeyChain]] used in signing
     *
     * @returns A signed [[StandardTx]]
     */
  abstract sign(kc:KCClass):StandardTx<
    KPClass, 
    KCClass, 
    StandardUnsignedTx<KPClass, KCClass, SBTx>
  >;

  constructor(transaction:SBTx = undefined, codecid:number = 0) {
    this.transaction = transaction;
  }
}

/**
 * Class representing a signed transaction.
 */
export abstract class StandardTx<
    KPClass extends KeyPair, 
    KCClass extends KeyChain<KPClass>, 
    SUBTx extends StandardUnsignedTx<
        KPClass, 
        KCClass, 
        StandardBaseTx<KPClass, KCClass>>
    > {
  protected unsignedTx:SUBTx = undefined;
  protected credentials:Array<Credential> = [];

  /**
     * Returns the [[StandardUnsignedTx]]
     */
  getUnsignedTx = ():SUBTx => {
    return this.unsignedTx;
  }

  abstract fromBuffer(bytes:Buffer, offset?:number):number;

  /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[StandardTx]].
     */
  toBuffer():Buffer {
    const txbuff:Buffer = this.unsignedTx.toBuffer();
    let bsize:number = txbuff.length;
    const credlen:Buffer = Buffer.alloc(4);
    credlen.writeUInt32BE(this.credentials.length, 0);
    const barr:Array<Buffer> = [txbuff, credlen];
    bsize += credlen.length;
    for (let i = 0; i < this.credentials.length; i++) {
      const credid:Buffer = Buffer.alloc(4);
      credid.writeUInt32BE(this.credentials[i].getCredentialID(), 0);
      barr.push(credid);
      bsize += credid.length;
      const credbuff:Buffer = this.credentials[i].toBuffer();
      bsize += credbuff.length;
      barr.push(credbuff);
    }
    const buff:Buffer = Buffer.concat(barr, bsize);
    return buff;
  }

  /**
     * Takes a base-58 string containing an [[StandardTx]], parses it, populates the class, and returns the length of the Tx in bytes.
     *
     * @param serialized A base-58 string containing a raw [[StandardTx]]
     *
     * @returns The length of the raw [[StandardTx]]
     *
     * @remarks
     * unlike most fromStrings, it expects the string to be serialized in cb58 format
     */
  fromString(serialized:string):number {
    return this.fromBuffer(bintools.cb58Decode(serialized));
  }

  /**
     * Returns a cb58 representation of the [[StandardTx]].
     *
     * @remarks
     * unlike most toStrings, this returns in cb58 serialization format
     */
  toString():string {
    return bintools.cb58Encode(this.toBuffer());
  }

  /**
     * Class representing a signed transaction.
     *
     * @param unsignedTx Optional [[StandardUnsignedTx]]
     * @param signatures Optional array of [[Credential]]s
     */
  constructor(unsignedTx:SUBTx = undefined, credentials:Array<Credential> = undefined) {
    if (typeof unsignedTx !== 'undefined') {
      this.unsignedTx = unsignedTx;
      if (typeof credentials !== 'undefined') {
        this.credentials = credentials;
      }
    }
  }
}
