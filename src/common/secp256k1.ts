/**
 * @packageDocumentation
 * @module Common-SECP256k1KeyChain
 */
import { Buffer } from "buffer/";
import * as elliptic from "elliptic";
import createHash from "create-hash";
import BinTools from '../utils/bintools';
import { StandardKeyPair, StandardKeyChain } from './keychain';

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
export abstract class SECP256k1KeyPair extends StandardKeyPair {
    protected keypair:elliptic.ec.KeyPair

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
     */
    generateKey = () => {
        this.keypair = ec.genKeyPair();
    
        // doing hex translation to get Buffer class
        this.privk = Buffer.from(this.keypair.getPrivate('hex').padStart(64, '0'), 'hex');
        this.pubk = Buffer.from(this.keypair.getPublic(true, 'hex').padStart(66, '0'), 'hex');
      };

  /**
     * Imports a private key and generates the appropriate public key.
     *
     * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key
     *
     * @returns true on success, false on failure
     */
    importKey = (privk:Buffer):boolean => {
        this.keypair = ec.keyFromPrivate(privk.toString('hex'), 'hex');
        // doing hex translation to get Buffer class
        this.privk = Buffer.from(this.keypair.getPrivate('hex').padStart(64, '0'), 'hex');
        this.pubk = Buffer.from(this.keypair.getPublic(true, 'hex').padStart(66, '0'), 'hex');
        return true; // silly I know, but the interface requires so it returns true on success, so if Buffer fails validation...
      };

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
    getAddressString:() => string;

  /**
     * Returns an address given a public key.
     *
     * @param pubk A {@link https://github.com/feross/buffer|Buffer} representing the public key
     *
     * @returns A {@link https://github.com/feross/buffer|Buffer} for the address of the public key.
     */
    addressFromPublicKey = (pubk:Buffer): Buffer => {
        if (pubk.length === 65) {
          /* istanbul ignore next */
          pubk = Buffer.from(ec.keyFromPublic(pubk).getPublic(true, 'hex').padStart(66, '0'), 'hex'); // make compact, stick back into buffer
        }
        if (pubk.length === 33) {
          const sha256:Buffer = Buffer.from(createHash('sha256').update(pubk).digest());
          const ripesha:Buffer = Buffer.from(createHash('ripemd160').update(sha256).digest());
          return ripesha;
        }
        /* istanbul ignore next */
        throw new Error('Unable to make address.');
      };

    /**
     * Returns a string representation of the private key.
     * 
     * @returns A cb58 serialized string representation of the public key
     */
    getPrivateKeyString = ():string => {
        return "PrivateKey-" + bintools.cb58Encode(this.privk);
    }

    /**
     * Returns the public key.
     * 
     * @returns A cb58 serialized string representation of the public key
     */
    getPublicKeyString = ():string => {
        return bintools.cb58Encode(this.pubk);
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
     * Class for representing a private and public keypair in Avalanche PlatformVM. 
     */
    constructor() {
        super();
    }
    
}

/**
 * Class for representing a key chain in Avalanche. 
 * 
 * @typeparam SECP256k1KeyPair Class extending [[StandardKeyPair]] which is used as the key in [[SECP256k1KeyChain]]
 */
export abstract class SECP256k1KeyChain<SECPKPClass extends SECP256k1KeyPair> extends StandardKeyChain<SECPKPClass> {

    /**
     * Makes a new key pair, returns the address.
     * 
     * @returns Address of the new key pair
     */
    makeKey:() => SECPKPClass; 

    addKey(newKey:SECPKPClass) {
        super.addKey(newKey);
    }

    /**
     * Given a private key, makes a new key pair, returns the address.
     * 
     * @param privk A {@link https://github.com/feross/buffer|Buffer} or cb58 serialized string representing the private key 
     * 
     * @returns Address of the new key pair
     */
    importKey:(privk:Buffer | string) => SECPKPClass;

}
