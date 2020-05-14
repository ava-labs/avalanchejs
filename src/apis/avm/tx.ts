/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import BinTools from '../../utils/bintools';
import createHash from "create-hash";
import { AVMConstants, InitialStates, Signature, SigIdx } from './types';
import { TransferableOutput } from './outputs';
import { TransferableInput } from './inputs';
import { TransferableOperation } from './ops';
import { Credential, SelectCredentialClass, SecpCredential } from './credentials';
import { AVMKeyChain, AVMKeyPair } from './keychain';

/**
 * @ignore
 */
const bintools = BinTools.getInstance();

/**
 * Takes a buffer representing the output and returns the proper [[BaseTx]] instance.
 * 
 * @param txtype The id of the transaction type 
 * 
 * @returns An instance of an [[BaseTx]]-extended class.
 */
export const SelectTxClass = (txtype:number, ...args:Array<any>):BaseTx => {
    if(txtype == AVMConstants.BASETX){
        let tx:BaseTx = new BaseTx(...args);
        return tx;
    } else if(txtype == AVMConstants.CREATEASSETTX){
        let tx:CreateAssetTx = new CreateAssetTx(...args);
        return tx;
    } else if(txtype == AVMConstants.OPERATIONTX){
        let tx:OperationTx = new OperationTx(...args);
        return tx;
    }
    /* istanbul ignore next */
    throw new Error("Error - SelectTxClass: unknown txtype " + txtype);
}

/** 
 * Class representing a base for all transactions.
 */
export class BaseTx {
    protected networkid:Buffer = Buffer.alloc(4);
    protected blockchainid:Buffer = Buffer.alloc(32);
    protected numouts:Buffer = Buffer.alloc(4);
    protected outs:Array<TransferableOutput>;
    protected numins:Buffer = Buffer.alloc(4);
    protected ins:Array<TransferableInput>;

    /**
     * Returns the id of the [[BaseTx]]
     */
    getTxType():number {
        return AVMConstants.BASETX;
    }

    /**
     * Returns the NetworkID as a number
     */
    getNetworkID = ():number => {
        return this.networkid.readUInt32BE(0);
    }

    /**
     * Returns the Buffer representation of the BlockchainID
     */
    getBlockchainID = ():Buffer => {
        return this.blockchainid;
    }
    
    /**
     * Returns the array of [[TransferableInput]]s
     */
    getIns = ():Array<TransferableInput> => {
        return this.ins;
    }

    /**
     * Returns the array of [[TransferableOutput]]s
     */
    getOuts = ():Array<TransferableOutput> => {
        return this.outs;
    }

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[BaseTx]], parses it, populates the class, and returns the length of the BaseTx in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[BaseTx]]
     * 
     * @returns The length of the raw [[BaseTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.networkid = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        this.blockchainid = bintools.copyFrom(bytes, offset, offset + 32);
        offset += 32;
        this.numouts = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let outcount:number = this.numouts.readUInt32BE(0);
        this.outs = [];
        for(let i = 0; i < outcount; i++){
            let outbuff:Buffer = bintools.copyFrom(bytes, offset, bytes.length);
            let xferout:TransferableOutput = new TransferableOutput();
            offset = xferout.fromBuffer(outbuff, 0);
            this.outs.push(xferout);
        }
        this.numins = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let incount:number = this.numins.readUInt32BE(0);
        this.ins = [];
        for(let i = 0; i < incount; i++){
            let inbuff:Buffer = bintools.copyFrom(bytes, offset, bytes.length);
            let xferin:TransferableInput = new TransferableInput();
            offset = xferin.fromBuffer(inbuff, 0);
            this.ins.push(xferin);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[BaseTx]].
     */
    toBuffer():Buffer {
        this.outs.sort(TransferableOutput.comparator());
        this.ins.sort(TransferableInput.comparator());
        this.numouts.writeUInt32BE(this.outs.length, 0);
        this.numins.writeUInt32BE(this.ins.length, 0);
        let bsize:number = this.networkid.length + this.blockchainid.length + this.numouts.length;
        let barr:Array<Buffer> = [this.networkid, this.blockchainid, this.numouts];
        for(let i = 0; i < this.outs.length; i++) {
            let b:Buffer = this.outs[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        barr.push(this.numins);
        bsize += this.numins.length;
        for(let i = 0; i < this.ins.length; i++) {
            let b:Buffer = this.ins[i].toBuffer();
            barr.push(b);
            bsize += b.length;
        }
        let buff:Buffer = Buffer.concat(barr, bsize);
        return buff;
    }

    /**
     * Returns a base-58 representation of the [[BaseTx]].
     */
    toString():string {
        return bintools.bufferToB58(this.toBuffer());
    }

    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     * 
     * @param msg A Buffer for the [[UnsignedTx]] 
     * @param kc An [[AVMKeyChain]] used in signing
     * 
     * @returns An array of [[Credential]]s
     */
    sign(msg:Buffer, kc:AVMKeyChain):Array<Credential> {
        let sigs:Array<Credential> = [];
        for(let i = 0; i < this.ins.length; i++) {
            let cred:Credential = new SecpCredential();
            let sigidxs:Array<SigIdx> = this.ins[i].getInput().getSigIdxs();
            for(let j = 0; j < sigidxs.length; j++) {
                let keypair:AVMKeyPair = kc.getKey(sigidxs[j].getSource());
                let signval:Buffer = keypair.sign(msg);
                let sig:Signature = new Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            sigs.push(cred);
        }
        return sigs;
    }

    /**
     * Class representing a BaseTx which is the foundation for all transactions.
     * 
     * @param networkid Optional networkid, default 2
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     */
    constructor(networkid:number = 2, blockchainid:Buffer = Buffer.alloc(32, 16), outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined) {
        this.networkid.writeUInt32BE(networkid, 0);
        this.blockchainid = blockchainid;
        if(typeof ins !== 'undefined' && typeof outs !== 'undefined'){
            this.numouts.writeUInt32BE(outs.length, 0);
            this.outs = outs.sort(TransferableOutput.comparator());
            this.numins.writeUInt32BE(ins.length, 0);
            this.ins = ins.sort(TransferableInput.comparator());
        }
    }
}

export class CreateAssetTx extends BaseTx {
    protected name:string = "";
    protected namebuff:Buffer = Buffer.alloc(2);
    protected symbol:string = "";
    protected symbolbuff:Buffer = Buffer.alloc(2);
    protected denomination:Buffer = Buffer.alloc(1);
    protected initialstate:InitialStates = new InitialStates();

    /**
     * Returns the id of the [[CreateAssetTx]]
     */
    getTxType():number {
        return AVMConstants.CREATEASSETTX;
    }

    /**
     * Returns the array of array of [[Output]]s for the initial state
     */
    getInitialStates = ():InitialStates => {
        return this.initialstate;
    }

    /**
     * Returns the string representation of the name
     */
    getName = ():string => {
        return this.name;
    }

    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the name
     */
    getNameBuffer = ():Buffer => {
        return this.namebuff;
    }

    /**
     * Returns the string representation of the symbol
     */
    getSymbol = ():string => {
        return this.symbol;
    }

    /**
     * Returns the {@link https://github.com/feross/buffer|Buffer} representation of the symbol
     */
    getSymbolBuffer = ():Buffer => {
        return this.symbolbuff;
    }

    /**
     * Returns the numeric representation of the denomination
     */
    getDenomination = ():number => {
        return this.denomination.readUInt8(0);
    }


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
        let namesize:number = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        this.namebuff = bintools.copyFrom(bytes, offset, offset + 2 + namesize);
        offset += 2;
        offset += namesize;
        let symsize:number = bintools.copyFrom(bytes, offset, offset + 2).readUInt16BE(0);
        this.symbolbuff = bintools.copyFrom(bytes, offset, offset + 2 + symsize);
        offset += 2;
        offset += symsize;
        this.denomination = bintools.copyFrom(bytes, offset, offset + 1);
        offset += 1;
        let inits:InitialStates = new InitialStates();
        offset = inits.fromBuffer(bytes, offset);
        this.initialstate = inits;
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[CreateAssetTx]].
     */
    toBuffer():Buffer {
        let superbuff:Buffer = super.toBuffer();
        let initstatebuff:Buffer = this.initialstate.toBuffer();
        let bsize:number = superbuff.length + this.namebuff.length + this.symbolbuff.length + this.denomination.length + initstatebuff.length;
        let barr:Array<Buffer> = [superbuff, this.namebuff, this.symbolbuff, this.denomination, initstatebuff];
        return Buffer.concat(barr, bsize);
    }
    
    /**
     * Class representing an unsigned Create Asset transaction.
     * 
     * @param networkid Optional networkid, default 2
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param name String for the descriptive name of the asset
     * @param symbol String for the ticker symbol of the asset
     * @param denomination Optional number for the denomination which is 10^D. D must be >= 0 and <= 32. Ex: $1 AVA = 10^9 $nAVA
     * @param initialstate Optional [[InitialStates]] that represent the intial state of a created asset
     */
    constructor(
            networkid:number = 2, blockchainid:Buffer = Buffer.alloc(32, 16), 
            outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined, 
            name:string = undefined, symbol:string = undefined, denomination:number = undefined, 
            initialstate:InitialStates = undefined
        ) {
        super(networkid, blockchainid, outs, ins);
        if(
            typeof name === 'string' && typeof symbol === 'string' && typeof denomination === 'number' && 
            denomination >= 0 && denomination <= 32 && typeof initialstate !== 'undefined'
        ) {
            this.initialstate = initialstate;
            this.namebuff = bintools.stringToBuffer(name);
            this.name = name;
            this.symbolbuff = bintools.stringToBuffer(symbol);
            this.symbol = symbol;
            this.denomination.writeUInt8(denomination, 0);
        }
    }
}

/**
 * Class representing an unsigned Operation transaction.
 */
export class OperationTx extends BaseTx {
    protected numOps:Buffer = Buffer.alloc(4);
    protected ops:Array<TransferableOperation> = [];
    

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[OperationTx]], parses it, populates the class, and returns the length of the [[OperationTx]] in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[OperationTx]]
     * 
     * @returns The length of the raw [[OperationTx]]
     * 
     * @remarks assume not-checksummed
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        offset = super.fromBuffer(bytes, offset);
        this.numOps = bintools.copyFrom(bytes, offset, offset + 4);
        offset += 4;
        let numOps:number = this.numOps.readUInt32BE(0);
        for(let i:number = 0; i < numOps; i++) {
            let op:TransferableOperation = new TransferableOperation();
            offset = op.fromBuffer(bytes, offset);
            this.ops.push(op);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[OperationTx]].
     */
    toBuffer():Buffer {
        this.numOps.writeUInt32BE(this.ops.length, 0);
        let barr:Array<Buffer> = [super.toBuffer(), this.numOps];
        for(let i = 0; i < this.ops.length; i++) {
            barr.push(this.ops[i].toBuffer());
        }
        return Buffer.concat(barr);
    }

    /**
     * Returns an array of [[Operation]]s in this transaction.
     */
    getOperations():Array<TransferableOperation> {
        return this.ops;
    }

    /**
     * Takes the bytes of an [[UnsignedTx]] and returns an array of [[Credential]]s
     * 
     * @param msg A Buffer for the [[UnsignedTx]] 
     * @param kc An [[AVMKeyChain]] used in signing
     * 
     * @returns An array of [[Credential]]s
     */
    sign(msg:Buffer, kc:AVMKeyChain):Array<Credential> {
        let sigs:Array<Credential> = super.sign(msg, kc);
        for(let i = 0; i < this.ops.length; i++) {
            let cred:Credential = new SecpCredential();
            let sigidxs:Array<SigIdx> = this.ops[i].getOperation().getSigIdxs();
            for(let j = 0; j < sigidxs.length; j++) {
                let keypair:AVMKeyPair = kc.getKey(sigidxs[j].getSource());
                let signval:Buffer = keypair.sign(msg);
                let sig:Signature = new Signature();
                sig.fromBuffer(signval);
                cred.addSignature(sig);
            }
            sigs.push(cred);
        }
        return sigs;
    }

    /**
     * Class representing an unsigned Operation transaction.
     * 
     * @param networkid Optional networkid, default 2
     * @param blockchainid Optional blockchainid, default Buffer.alloc(32, 16)
     * @param outs Optional array of the [[TransferableOutput]]s
     * @param ins Optional array of the [[TransferableInput]]s
     * @param ops Array of [[Operation]]s used in the transaction
     */
    constructor(
        networkid:number = 2, blockchainid:Buffer = Buffer.alloc(32, 16),
        outs:Array<TransferableOutput> = undefined, ins:Array<TransferableInput> = undefined, 
        ops:Array<TransferableOperation> = undefined
        ) {
        super(networkid, blockchainid, outs, ins );
        if(typeof ops !== 'undefined' && Array.isArray(ops)) {
            for(let i = 0; i < ops.length; i++) {
                if(!(ops[i] instanceof TransferableOperation)) {
                    throw new Error("Error - OperationTx.constructor: invalid op in array parameter 'ops'")
                }
            }
            this.ops = ops;
        }
    }
}

/**
 * Class representing an unsigned transaction.
 */
export class UnsignedTx {
    protected transaction:BaseTx;

    getTransaction = ():BaseTx => {
        return this.transaction;
    }

    fromBuffer(bytes:Buffer, offset:number = 0):number {
        let txtype:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.transaction = SelectTxClass(txtype);
        return offset + this.transaction.fromBuffer(bytes, offset);
    }

    toBuffer():Buffer {
        let txtype:Buffer = Buffer.alloc(4);
        txtype.writeInt32BE(this.transaction.getTxType(), 0);
        let basebuff = this.transaction.toBuffer();
        return Buffer.concat([txtype, basebuff], txtype.length + basebuff.length);
    }

    /**
     * Signs this [[UnsignedTx]] and returns signed [[Tx]]
     * 
     * @param kc An [[AVMKeyChain]] used in signing
     * 
     * @returns A signed [[Tx]]
     */
    sign(kc:AVMKeyChain):Tx {
        let txbuff = this.toBuffer();
        let msg:Buffer = Buffer.from(createHash('sha256').update(txbuff).digest()); 
        let sigs:Array<Credential> = this.transaction.sign(msg, kc);
        return new Tx(this, sigs);
    }

    constructor(transaction:BaseTx = undefined) {
        this.transaction = transaction;
    }
}

/**
 * Class representing a signed transaction.
 */
export class Tx {
    protected unsignedTx:UnsignedTx = new UnsignedTx();
    protected signatures:Array<Credential> = [];

    /**
     * Takes a {@link https://github.com/feross/buffer|Buffer} containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     * 
     * @param bytes A {@link https://github.com/feross/buffer|Buffer} containing a raw [[Tx]]
     * @param offset A number representing the starting point of the bytes to begin parsing
     * 
     * @returns The length of the raw [[Tx]]
     */
    fromBuffer(bytes:Buffer, offset:number = 0):number {
        this.unsignedTx = new UnsignedTx();
        offset = this.unsignedTx.fromBuffer(bytes, offset);
        let numcreds:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
        offset += 4;
        this.signatures = [];
        for(let i = 0; i < numcreds; i++){
            let credid:number = bintools.copyFrom(bytes, offset, offset + 4).readUInt32BE(0);
            offset += 4;
            let cred:Credential = SelectCredentialClass(credid);
            offset += cred.fromBuffer(bytes, offset);
            this.signatures.push(cred);
        }
        return offset;
    }

    /**
     * Returns a {@link https://github.com/feross/buffer|Buffer} representation of the [[Tx]].
     */
    toBuffer():Buffer {
        let txbuff:Buffer = this.unsignedTx.toBuffer();
        let bsize:number = txbuff.length;
        let sigarrlen:Buffer = Buffer.alloc(4);
        sigarrlen.writeUInt32BE(this.signatures.length, 0);
        let barr:Array<Buffer> = [txbuff, sigarrlen];
        bsize += sigarrlen.length;
        for(let i = 0; i < this.signatures.length; i++){
            let credid:Buffer = Buffer.alloc(4);
            credid.writeInt32BE(this.signatures[i].getCredentialID(), 0);
            barr.push(credid);
            bsize += credid.length;
            let sigbuff:Buffer = this.signatures[i].toBuffer();
            bsize += sigbuff.length;
            barr.push(sigbuff)
        }
        let buff:Buffer = Buffer.concat(barr, bsize);
        return buff;
    }

    /**
     * Takes a base-58 string containing an [[Tx]], parses it, populates the class, and returns the length of the Tx in bytes.
     * 
     * @param serialized A base-58 string containing a raw [[Tx]]
     * 
     * @returns The length of the raw [[Tx]]
     * 
     * @remarks 
     * unlike most fromStrings, it expects the string to be serialized in AVA format
     */
    fromString(serialized:string):number {
        return this.fromBuffer(bintools.avaDeserialize(serialized));
    }

    /**
     * Returns a base-58 AVA-serialized representation of the [[Tx]].
     * 
     * @remarks 
     * unlike most toStrings, this returns in AVA serialization format
     */
    toString():string {
        return bintools.avaSerialize(this.toBuffer());
    }

    /**
     * Class representing a signed transaction.
     * 
     * @param unsignedTx Optional [[UnsignedTx]]
     * @param signatures Optional array of [[Credential]]s
     */
    constructor(unsignedTx:UnsignedTx = undefined, signatures:Array<Credential> = undefined) {
        if(typeof unsignedTx !== 'undefined'){
            this.unsignedTx = unsignedTx;
            if(typeof signatures !== 'undefined'){
                this.signatures = signatures
            }
        }
    }
}

