/**
 * @packageDocumentation
 * @module PlatformAPI-KeyChain
 */
import { Buffer } from "buffer/";
import * as elliptic from "elliptic";
import createHash from "create-hash";
import BinTools from '../../utils/bintools';
import { KeyPair, KeyChain } from '../../utils/types';

/**
 * @ignore
 */
const EC: typeof elliptic.ec = elliptic.ec;

/**
 * @ignore
 */
const ec: elliptic.ec = new EC('secp256k1');

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
const bintools: BinTools = BinTools.getInstance();


/**
 * Class for representing a private and public keypair on the Platform Chain. 
 */
export class PlatformKeyPair extends KeyPair {
    protected keypair:elliptic.ec.KeyPair
    protected entropy:Buffer;

    /**
     * @ignore
     */
    protected _sigFromSigBuffer = (sig:Buffer):elliptic.ec.SignatureOptions => {
        const r = new BN(bintools.copyFrom(sig, 0, 32));
        const s = new BN(bintools.copyFrom(sig, 32, 64));
        const recoveryParam:number = bintools.copyFrom(sig, 64, 65).readUIntBE(0, 1);
        const sigOpt = {
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
        this.entropy = entropy;
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
        this.keypair = ec.keyFromPrivate(privk.toString("hex"),"hex");
        // doing hex translation to get Buffer class
        this.privk = Buffer.from(this.keypair.getPrivate("hex"), "hex");
        this.pubk = Buffer.from(this.keypair.getPublic(true, "hex"), "hex");
        return true;
    }

    /**
     * Returns the address as a {@link https://github.com/feross/buffer|Buffer}.
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} representation of the address
     */
    getAddress = ():Buffer => {
        return this.addressFromPublicKey(this.pubk);
    }

    /**
     * Returns the address's string representation.
     * 
     * @returns A string representation of the address
     */
    getAddressString = ():string => {
        const addr:Buffer = this.addressFromPublicKey(this.pubk);
        return bintools.addressToString(this.chainid, addr);
    }

    /**
     * Returns an address given a public key.
     * 
     * @param pubk A {@link https://github.com/feross/buffer|Buffer} representing the public key
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} for the address of the public key.
     */
    addressFromPublicKey = (pubk:Buffer): Buffer => {
        if(pubk.length == 65) {
            /* istanbul ignore next */
            pubk = Buffer.from(ec.keyFromPublic(pubk).getPublic(true, "hex"), "hex"); //make compact, stick back into buffer
        } 
        if(pubk.length == 33){
            const sha256:Buffer = Buffer.from(createHash('sha256').update(pubk).digest());
            const ripesha:Buffer = Buffer.from(createHash('rmd160').update(sha256).digest());
            return ripesha;
        }
        /* istanbul ignore next */
        throw new Error("Unable to make address.");
    }

    /**
     * Returns a string representation of the private key.
     * 
     * @returns An AVA serialized string representation of the public key
     */
    getPrivateKeyString = ():string => {
        return bintools.avaSerialize(this.privk);
    }

    /**
     * Returns the public key.
     * 
     * @returns An AVA serialized string representation of the public key
     */
    getPublicKeyString = ():string => {
        return bintools.avaSerialize(this.pubk);
    }


    /**
     * Takes a message, signs it, and returns the signature.
     * 
     * @param msg The message to sign, be sure to hash first if expected
     * 
     * @returns A {@link https://github.com/feross/buffer|Buffer} containing the signature
     */
    sign = (msg:Buffer):Buffer => {
        const sigObj = this.keypair.sign(msg, undefined, { canonical: true });
        const recovery:Buffer = Buffer.alloc(1);
        recovery.writeUInt8(sigObj.recoveryParam, 0);
        const r:Buffer = Buffer.from(sigObj.r.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
        const s:Buffer = Buffer.from(sigObj.s.toArray("be", 32)); //we have to skip native Buffer class, so this is the way
        const result:Buffer = Buffer.concat([r,s, recovery], 65);
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
        const sigObj:elliptic.ec.SignatureOptions = this._sigFromSigBuffer(sig);
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
        const sigObj:elliptic.ec.SignatureOptions = this._sigFromSigBuffer(sig);
        const pubk = ec.recoverPubKey(msg, sigObj, sigObj.recoveryParam);
        return Buffer.from(pubk.encodeCompressed());
    }

    /**
     * Class for representing a private and public keypair in Avalanche. 
     */
    constructor(chainid:string, entropy:Buffer = undefined) {
        super(chainid);
        this.generateKey();
    }
    
}

/**
 * Class for representing a key chain in Avalanche. 
 * 
 * @typeparam PlatformKeyPair Class extending [[KeyPair]] which is used as the key in [[PlatformKeyChain]]
 */
export class PlatformKeyChain extends KeyChain<PlatformKeyPair> {

    /**
     * Makes a new key pair, returns the address.
     * 
     * @param entropy Optional parameter that may be necessary to produce secure keys
     * 
     * @returns Address of the new key pair
     */
    makeKey = (entropy:Buffer = undefined):Buffer => {
        let keypair:PlatformKeyPair = new PlatformKeyPair(this.chainid, entropy);
        this.addKey(keypair);
        return keypair.getAddress();
    }

    /**
     * Given a private key, makes a new key pair, returns the address.
     * 
     * @param privk A {@link https://github.com/feross/buffer|Buffer} or AVA serialized string representing the private key 
     * 
     * @returns Address of the new key pair
     */
    importKey = (privk:Buffer | string):Buffer => {
        let keypair:PlatformKeyPair = new PlatformKeyPair(this.chainid);
        let pk:Buffer;
        if(typeof privk === 'string'){
            pk = bintools.avaDeserialize(privk);
        } else {
            pk = bintools.copyFrom(privk);
        }
        keypair.importKey(pk);
        if(!(keypair.getAddress().toString("hex") in this.keys)){
            this.addKey(keypair);
        }
        return keypair.getAddress();
    }

    /**
     * Returns instance of PlatformKeyChain.
     */
    constructor(chainid:string){
        super(chainid);
    }
}