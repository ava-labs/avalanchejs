/**
 * @module AVMAPI
 */
import {Buffer} from "buffer/";
import * as elliptic from "elliptic";
import BinTools from '../../utils/bintools';
import { TxUnsigned, Tx } from './tx';
import { Signature, SigIdx } from './types';
import { Input } from './inputs';
import createHash from "create-hash";
import { KeyPair, KeyChain } from '../../utils/types';

/**
 * @ignore
 */
const EC = elliptic.ec;

/**
 * @ignore
 */
const ec = new EC('secp256k1');

/**
 * @ignore
 */
const ecparams = ec.curve;

/**
 * @ignore
 */
const BN = ecparams.n.constructor;

/**
 * @ignore
 */
const bintools = BinTools.getInstance();


/**
 * Class for representing a private and public keypair in AVAJS. 
 */
export class AVMKeyPair extends KeyPair {
    protected keypair:elliptic.ec.KeyPair

    /**
     * @ignore
     */
    protected _sigFromSigBuffer = (sig:Buffer):elliptic.ec.SignatureOptions => {
        let r = new BN(bintools.copyFrom(sig, 0, 32));
        let s = new BN(bintools.copyFrom(sig, 32, 64));
        let recoveryParam:number = bintools.copyFrom(sig, 64, 65).readUIntBE(0, 1);
        let sigOpt = {
            r:r,
            s:s,
            recoveryParam:recoveryParam
        };
        return sigOpt;
    }

    /**
     * Generates a new keypair.
     * 
     * @param entropy Optional parameter that may be necessary to produce secure keys
     */
    generateKey = (entropy?:Buffer) => {
        this.keypair = ec.genKeyPair();

        // doing hex translation to get Buffer class
        this.privk = Buffer.from(this.keypair.getPrivate("hex"), "hex");
        this.pubk = Buffer.from(this.keypair.getPublic(true, "hex"), "hex");
    }

    /**
     * Imports a private key and generates the appropriate public key.
     * 
     * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key 
     * 
     * @returns true on success, false on failure
     */
    importKey = (privk:Buffer):boolean => {
        this.keypair = ec.keyFromPrivate(privk);
        // doing hex translation to get Buffer class
        this.privk = Buffer.from(this.keypair.getPrivate("hex"), "hex");
        this.pubk = Buffer.from(this.keypair.getPublic(true, "hex"), "hex");
        return true; //silly I know, but the interface requires so it returns true on success, so if Buffer fails validation...
    }

    /**
     * Returns the address.
     * 
     * @returns A string representation of the address
     */
    getAddress = ():string => {
        return this.addressFromPublicKey(this.pubk);
    }

    /**
     * Returns an address given a public key.
     * 
     * @param pubk A {@link https://github.com/feross/buffer|Buffer} representing the public key
     * 
     * @returns A string for the address of the public key.
     */
    addressFromPublicKey = (pubk:Buffer): string => {
        let address:string = "";
        if(pubk.length == 65) {
            /* istanbul ignore next */
            pubk = Buffer.from(ec.keyFromPublic(pubk).getPublic(true, "hex"), "hex"); //make compact, stick back into buffer
        } 
        if(pubk.length == 33){
            let sha256:Buffer = Buffer.from(createHash('sha256').update(pubk).digest());
            let ripesha:Buffer = Buffer.from(createHash('rmd160').update(sha256).digest());
            address = bintools.avaSerialize(ripesha);
            return address;
        }
        /* istanbul ignore next */
        throw new Error("Unable to make address.");
    }

    /**
     * Returns a string representation of the private key.
     * 
     * @returns A string representation of the public key
     */
    getPrivateKeyString = ():string => {
        return bintools.bufferToB58(this.privk);
    }

    /**
     * Returns the public key.
     * 
     * @returns A string representation of the public key
     */
    getPublicKeyString = ():string => {
        return bintools.bufferToB58(this.pubk);
    }

    /**
     * Takes a message, signs it, and returns the signature.
     * 
     * @param msg The message to sign
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the signature
     */
    sign = (msg:Buffer):Buffer => {
        let sigObj = this.keypair.sign(msg, undefined, { canonical: true });
        let recovery:Buffer = Buffer.alloc(1);
        recovery.writeUInt8(sigObj.recoveryParam, 0);
        let r:Buffer = Buffer.from(sigObj.r.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
        let s:Buffer = Buffer.from(sigObj.s.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
        let result:Buffer = Buffer.concat([r,s, recovery], 65);
        return result;
    }
    
    /**
     * Verifies that the private key associated with the provided public key produces the signature associated with the given message.
     * 
     * @param msg The message associated with the signature
     * @param sig The signature of the signed message
     * 
     * @returns True on success, false on failure
     */
    verify = (msg:Buffer, sig:Buffer):boolean => { 
        let sigObj:elliptic.ec.SignatureOptions = this._sigFromSigBuffer(sig);
        return ec.verify(msg, sigObj, this.keypair);
    }

    /**
     * Recovers the public key of a message signer from a message and its associated signature.
     * 
     * @param msg The message that's signed
     * @param sig The signature that's signed on the message
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key of the signer
     */
    recover = (msg:Buffer, sig:Buffer):Buffer => {
        let sigObj:elliptic.ec.SignatureOptions = this._sigFromSigBuffer(sig);
        let pubk = ec.recoverPubKey(msg, sigObj, sigObj.recoveryParam);
        return Buffer.from(pubk.encodeCompressed());
    }

    /**
     * Class for representing a private and public keypair in AVAJS. 
     */
    constructor(entropy:Buffer | boolean = false) {
        super();
        this.generateKey();
    }
    
}

/**
 * Class for representing a key chain in AVAJS. 
 * 
 * @typeparam AVMKeyPair Class extending [[KeyPair]] which is used as the key in [[AVMKeyChain]]
 */
export class AVMKeyChain extends KeyChain<AVMKeyPair> {

    /**
     * Makes a new key pair, returns the address.
     * 
     * @param entropy Optional parameter that may be necessary to produce secure keys
     * 
     * @returns Address of the new key pair
     */
    makeKey = (entropy:Buffer | boolean = false):string => {
        let keypair:AVMKeyPair = new AVMKeyPair(entropy);
        this.addKey(keypair);
        return keypair.getAddress();
    }

    /**
     * Given a private key, makes a new key pair, returns the address.
     * 
     * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key 
     * 
     * @returns Address of the new key pair
     */
    importKey = (privk:Buffer):string => {
        let keypair:AVMKeyPair = new AVMKeyPair();
        keypair.importKey(privk);
        if(!(keypair.getAddress() in this.keys)){
            this.addKey(keypair);
        }
        return keypair.getAddress();
    }

    /**
     * Signs a [[TxUnsigned]] and returns signed [[Tx]]
     * 
     * @param utx A [[TxUnsigned]] that needs to be signed
     * 
     * @returns A signed [[Tx]]
     */
    signTx = (utx:TxUnsigned):Tx => {
        let txbuff = utx.toBuffer(); 
        let sigs:Array<Signature> = [];
        let ins:Array<Input> = utx.getIns();
        for(let i = 0; i < ins.length; i++){
            let sigidxs:Array<SigIdx> = ins[i].getSigIdxs();
            for(let j = 0; j < sigidxs.length; j++){
                let keypair:AVMKeyPair = this.getKey(sigidxs[j].getSource());
                let sig:Signature = new Signature();
                sig.fromBuffer(keypair.sign(txbuff));
                sigs.push(sig);
            }
        }
        return new Tx(utx, sigs);
    }

    /**
     * Returns instance of AVMKeyChain.
     */
    constructor(){
        super();
    }
}