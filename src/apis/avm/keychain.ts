/**
 * @packageDocumentation
 * @module API-AVM-KeyChain
 */
import { Buffer } from 'buffer/';
import BinTools from '../../utils/bintools';
import { SECP256k1KeyChain, SECP256k1KeyPair } from '../../common/secp256k1';

/**
 * @ignore
 */
const bintools: BinTools = BinTools.getInstance();


/**
 * Class for representing a private and public keypair on an AVM Chain. 
 */
export class AVMKeyPair extends SECP256k1KeyPair {

    protected chainid:string = '';
    protected hrp:string = '';

    /**
     * Returns the address's string representation.
     * 
     * @returns A string representation of the address
     */
    getAddressString = ():string => {
        const addr:Buffer = this.addressFromPublicKey(this.pubk);
        return bintools.addressToString(this.hrp, this.chainid, addr);
    }

    /**
       * Returns the chainID associated with this key.
       *
       * @returns The [[KeyPair]]'s chainID
       */
    getChainID = ():string => this.chainid;

    /**
     * Sets the the chainID associated with this key.
     *
     * @param chainid String for the chainID
     */
    setChainID = (chainid:string):void => {
        this.chainid = chainid;
    };
    

    /**
     * Returns the Human-Readable-Part of the network associated with this key.
     *
     * @returns The [[KeyPair]]'s Human-Readable-Part of the network's Bech32 addressing scheme
     */
    getHRP = ():string => this.hrp;
  
    /**
     * Sets the the Human-Readable-Part of the network associated with this key.
     *
     * @param hrp String for the Human-Readable-Part of Bech32 addresses
     */
    setHRP = (hrp:string):void => {
      this.hrp = hrp;
    };

    constructor(hrp:string, chainid:string) {
        super();
        this.chainid = chainid;
        this.hrp = hrp;
        this.generateKey();
    }
    
}

/**
 * Class for representing a key chain in Avalanche. 
 * 
 * @typeparam AVMKeyPair Class extending [[KeyPair]] which is used as the key in [[AVMKeyChain]]
 */
export class AVMKeyChain extends SECP256k1KeyChain<AVMKeyPair> {

    hrp:string = '';
    chainid:string = '';

    /**
     * Makes a new key pair, returns the address.
     * 
     * @returns The new key pair
     */
    makeKey = ():AVMKeyPair => {
        let keypair:AVMKeyPair = new AVMKeyPair(this.hrp, this.chainid);
        this.addKey(keypair);
        return keypair
    }

    addKey = (newKey:AVMKeyPair) => {
        newKey.setChainID(this.chainid);
        super.addKey(newKey);
    }

    /**
     * Given a private key, makes a new key pair, returns the address.
     * 
     * @param privk A {@link https://github.com/feross/buffer|Buffer} or cb58 serialized string representing the private key 
     * 
     * @returns The new key pair
     */
    importKey = (privk:Buffer | string):AVMKeyPair => {
        let keypair:AVMKeyPair = new AVMKeyPair(this.hrp, this.chainid);
        let pk:Buffer;
        if(typeof privk === 'string'){
            pk = bintools.cb58Decode(privk.split('-')[1]);
        } else {
            pk = bintools.copyFrom(privk);
        }
        keypair.importKey(pk);
        if(!(keypair.getAddress().toString("hex") in this.keys)){
            this.addKey(keypair);
        }
        return keypair;
    }

    /**
     * Returns instance of AVMKeyChain.
     */
    constructor(hrp:string, chainid:string){
        super();
        this.hrp = hrp;
        this.chainid = chainid;
    }
}
