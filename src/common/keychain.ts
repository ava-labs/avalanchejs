/**
 * @packageDocumentation
 * @module Common-KeyChain
 */

import { Buffer } from "buffer/";

/**
 * Class for representing a private and public keypair in Avalanche. 
 * All APIs that need key pairs should extend on this class.
 */
export abstract class StandardKeyPair {
    protected pubk:Buffer;
    protected privk:Buffer;
  
    /**
       * Generates a new keypair.
       *
       * @param entropy Optional parameter that may be necessary to produce secure keys
       */
    generateKey:(entropy?:Buffer) => void;
  
    /**
       * Imports a private key and generates the appropriate public key.
       *
       * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key
       *
       * @returns true on success, false on failure
       */
    importKey:(privk:Buffer) => boolean;
  
    /**
       * Takes a message, signs it, and returns the signature.
       *
       * @param msg The message to sign
       *
       * @returns A {@link https://github.com/feross/buffer|Buffer} containing the signature
       */
    sign:(msg:Buffer) => Buffer;
  
    /**
       * Recovers the public key of a message signer from a message and its associated signature.
       *
       * @param msg The message that's signed
       * @param sig The signature that's signed on the message
       *
       * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public
       * key of the signer
       */
    recover:(msg:Buffer, sig:Buffer) => Buffer;
  
    /**
       * Verifies that the private key associated with the provided public key produces the
       * signature associated with the given message.
       *
       * @param msg The message associated with the signature
       * @param sig The signature of the signed message
       * @param pubk The public key associated with the message signature
       *
       * @returns True on success, false on failure
       */
    verify:(msg:Buffer, sig:Buffer, pubk:Buffer) => boolean;
  
    /**
       * Returns a reference to the private key.
       *
       * @returns A {@link https://github.com/feross/buffer|Buffer} containing the private key
       */
    getPrivateKey = ():Buffer => this.privk;
  
    /**
       * Returns a reference to the public key.
       *
       * @returns A {@link https://github.com/feross/buffer|Buffer} containing the public key
       */
    getPublicKey = ():Buffer => this.pubk;
  
    /**
       * Returns a string representation of the private key.
       *
       * @returns A string representation of the public key
       */
    getPrivateKeyString:() => string;
  
    /**
       * Returns the public key.
       *
       * @returns A string representation of the public key
       */
    getPublicKeyString:() => string;
  
    /**
       * Returns the address.
       *
       * @returns A {@link https://github.com/feross/buffer|Buffer}  representation of the address
       */
    getAddress:() => Buffer;

    /**
     * Returns the address's string representation.
     * 
     * @returns A string representation of the address
     */
    getAddressString:() => string

    abstract create(...args:any[]):this;

    abstract clone():this;
  
  }
  
  /**
   * Class for representing a key chain in Avalanche.
   * All endpoints that need key chains should extend on this class.
   *
   * @typeparam KPClass extending [[StandardKeyPair]] which is used as the key in [[StandardKeyChain]]
   */
  export abstract class StandardKeyChain<KPClass extends StandardKeyPair> {
    protected keys:{[address: string]: KPClass} = {};
  
    /**
       * Makes a new [[StandardKeyPair]], returns the address.
       *
       * @returns Address of the new [[StandardKeyPair]]
       */
    makeKey:() => KPClass;
  
    /**
       * Given a private key, makes a new [[StandardKeyPair]], returns the address.
       *
       * @param privk A {@link https://github.com/feross/buffer|Buffer} representing the private key
       *
       * @returns A new [[StandardKeyPair]]
       */
    importKey:(privk:Buffer) => KPClass;
  
    /**
       * Gets an array of addresses stored in the [[StandardKeyChain]].
       *
       * @returns An array of {@link https://github.com/feross/buffer|Buffer}  representations
       * of the addresses
       */
    getAddresses = ():Array<Buffer> => Object.values(this.keys).map((kp) => kp.getAddress());
  
    /**
       * Gets an array of addresses stored in the [[StandardKeyChain]].
       *
       * @returns An array of string representations of the addresses
       */
    getAddressStrings = ():Array<string> => Object.values(this.keys)
      .map((kp) => kp.getAddressString());
  
    /**
       * Adds the key pair to the list of the keys managed in the [[StandardKeyChain]].
       *
       * @param newKey A key pair of the appropriate class to be added to the [[StandardKeyChain]]
       */
    addKey(newKey:KPClass) {
      this.keys[newKey.getAddress().toString('hex')] = newKey;
    };
  
    /**
       * Removes the key pair from the list of they keys managed in the [[StandardKeyChain]].
       *
       * @param key A {@link https://github.com/feross/buffer|Buffer} for the address or
       * KPClass to remove
       *
       * @returns The boolean true if a key was removed.
       */
    removeKey = (key:KPClass | Buffer) => {
      let kaddr:string;
      if (key instanceof Buffer) {
        kaddr = key.toString('hex');
      } else {
        kaddr = key.getAddress().toString('hex');
      }
      if (kaddr in this.keys) {
        delete this.keys[kaddr];
        return true;
      }
      return false;
    };
  
    /**
       * Checks if there is a key associated with the provided address.
       *
       * @param address The address to check for existence in the keys database
       *
       * @returns True on success, false if not found
       */
    hasKey = (address:Buffer):boolean => (address.toString('hex') in this.keys);
  
    /**
       * Returns the [[StandardKeyPair]] listed under the provided address
       *
       * @param address The {@link https://github.com/feross/buffer|Buffer} of the address to
       * retrieve from the keys database
       *
       * @returns A reference to the [[StandardKeyPair]] in the keys database
       */
    getKey = (address:Buffer): KPClass => this.keys[address.toString('hex')];

    abstract create(...args:any[]):this;

    abstract clone():this;

    abstract union(kc:this):this;
    
  }