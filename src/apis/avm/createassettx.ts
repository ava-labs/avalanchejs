/**
 * @packageDocumentation
 * @module API-AVM-CreateAssetTx
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { AVMConstants } from './constants';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { InitialStates } from './initialstates';
import { BaseTx } from './basetx';
import { DefaultNetworkID } from '../../utils/constants';
import { Serialization, SerializedEncoding } from '../../utils/serialization';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();
const serializer = Serialization.getInstance();

export class CreateAssetTx extends BaseTx {
  protected _typeName = "CreateAssetTx";
  protected _typeID = AVMConstants.CREATEASSETTX;

  serialize(encoding:SerializedEncoding = "hex"):object {
    let fields:object = super.serialize(encoding);
    return {
      ...fields,
      "name": serializer.encoder(this.name, encoding, "utf8", "utf8"),
      "symbol": serializer.encoder(this.symbol, encoding, "utf8", "utf8"),
      "denomination": serializer.encoder(this.denomination, encoding, "Buffer", "decimalString", 1),
      "initialstate": this.initialstate.serialize(encoding)
    }
  };
  deserialize(fields:object, encoding:SerializedEncoding = "hex") {
    super.deserialize(fields, encoding);
    this.name = serializer.decoder(fields["name"], encoding, "utf8", "utf8");
    this.symbol = serializer.decoder(fields["symbol"], encoding, "utf8", "utf8");
    this.denomination = serializer.decoder(fields["denomination"], encoding, "decimalString", "Buffer", 1);
    this.initialstate = new InitialStates();
    this.initialstate.deserialize(fields["initialstate"], encoding);
  }

  protected name:string = '';
  protected symbol:string = '';
  protected denomination:Buffer = Buffer.alloc(1);
  protected initialstate:InitialStates = new InitialStates();

  /**
   * Returns the id of the [[CreateAssetTx]]
   */
  getTxType = ():number => {
    return this._typeID;
  }

  /**
   * Returns the array of array of [[Output]]s for the initial state
   */
  getInitialStates = ():InitialStates => this.initialstate;

  /**
   * Returns the string representation of the name
   */
  getName = ():string => this.name;

  /**
   * Returns the string representation of the symbol
   */
  getSymbol = ():string => this.symbol;

  /**
   * Returns the numeric representation of the denomination
   */
  getDenomination = ():number => this.denomination.readUInt8(0);

  /**
   * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the denomination
   */
  getDenominationBuffer = ():Buffer => {
      return this.denomination;
  }

  /**
   * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[CreateAssetTx]], parses it, populates the class, and returns the length of the [[CreateAssetTx]] in bytes.
   *
   * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[CreateAssetTx]]
   *
   * @returns The length of the raw [[CreateAssetTx]]
   *
   * @remarks assume not-checksummed
   */
  fromBuffer(bytes:Buffer, offset:number = 0):number {
    offset = super.fromBuffer(bytes, offset);

    const namesize:number = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
    offset += 2;
    this.name = bintools.copyFrom(bytes, offset, offset + namesize).toString('utf8');
    offset += namesize;

    const symsize:number = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
    offset += 2;
    this.symbol = bintools.copyFrom(bytes, offset, offset + symsize).toString('utf8');
    offset += symsize;

    this.denomination = bintools.copyFrom(bytes, offset, offset + 1);
    offset += 1;

    const inits:InitialStates = new InitialStates();
    offset = inits.fromBuffer(bytes, offset);
    this.initialstate = inits;

    return offset;
  }

  /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
     */
  toBuffer():Buffer {
    const superbuff:Buffer = super.toBuffer();
    const initstatebuff:Buffer = this.initialstate.toBuffer();

    const namebuff:Buffer = Buffer.alloc(this.name.length);
    namebuff.write(this.name, 0, this.name.length, 'utf8');
    const namesize:Buffer = Buffer.alloc(2);
    namesize.writeUInt16BE(this.name.length, 0);

    const symbuff:Buffer = Buffer.alloc(this.symbol.length);
    symbuff.write(this.symbol, 0, this.symbol.length, 'utf8');
    const symsize:Buffer = Buffer.alloc(2);
    symsize.writeUInt16BE(this.symbol.length, 0);

    const bsize:number = superbuff.length + namesize.length + namebuff.length + symsize.length + symbuff.length + this.denomination.length + initstatebuff.length;
    const barr:Array<Buffer> = [superbuff, namesize, namebuff, symsize, symbuff, this.denomination, initstatebuff];
    return Buffer.concat(barr, bsize);
  }

  clone():this {
    let newbase:CreateAssetTx = new CreateAssetTx();
    newbase.fromBuffer(this.toBuffer());
    return newbase as this;
  }

  create(...args:any[]):this {
      return new CreateAssetTx(...args) as this;
  }

  /**
   * Class representing an unsigned Create Asset transaction.
   *
   * @param networkid Optional networkid, [[DefaultNetworkID]]
   * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
   * @param outs Optional array of the [[TransferableOutput]]s
   * @param ins Optional array of the [[TransferableInput]]s
   * @param memo Optional {@link https://github.com/feross/buffer|Buffer} for the memo field
   * @param name String for the descriptive name of the asset
   * @param symbol String for the ticker symbol of the asset
   * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVAX = 10^9 $nAVAX
   * @param initialstate Optional [[InitialStates]] that represent the intial state of a created asset
   */
  constructor(
    networkid:number = DefaultNetworkID, blockchainid:Buffer = Buffer.alloc(32, 16),
    outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined,
    memo:Buffer = undefined, name:string = undefined, symbol:string = undefined, denomination:number = undefined,
    initialstate:InitialStates = undefined
  ) {
    super(networkid, blockchainid, outs, ins, memo);
    if (
      typeof name === 'string' && typeof symbol === 'string' && typeof denomination === 'number'
            && denomination >= 0 && denomination <= 32 && typeof initialstate !== 'undefined'
    ) {
      this.initialstate = initialstate;
      this.name = name;
      this.symbol = symbol;
      this.denomination.writeUInt8(denomination, 0);
    }
  }
}