# Slopes - The AVA Platform JavaScript Library

## Overview

Slopes is a JavaScript Library built using TypeScript and intended to support both browser and Node.js. 

## Getting Started

Slopes requires Node.js LTS version 12.13.1 or higher to compile. 

Slopes depends on the following two Node.js modules internally, and we suggest that your project uses them as well:

 * Buffer: Enables Node.js's Buffer library in the browser.
   * https://github.com/feross/buffer
   * `npm install --save buffer`
 * BN.js: A bignumber library for Node.js and browser.
   * https://github.com/indutny/bn.js/
   * `npm install --save bn.js`

Both of the above modules are extremely useful when interacting with Slopes as they are the input and output types of many base classes in the library. 

### Installation 

Slopes is available for install via `npm`:

`npm install --save slopes`

You can also pull the repo down directly and build it from scratch:

`npm run build`

This will generate a pure javascript library and place it in a folder named "dist" in the project root. The "slopes.js" file can then be dropped into any project as a pure javaescript implementation of Slopes.

The Slopes library can be imported into your existing Node.js project as follows:

```js
const slopes = require("slopes");
```
Or into your TypeScript project like this:

```js
import * as slopes from "slopes"
```
### Building With Slopes

We built Slopes with ease of use in mind. With this library, any Javascript developer is able to interact with a node on the AVA Platform who has enabled their RPC endpoints for the developer's consumption. We keep the library up-to-date with the latest changes in the [AVA Platform Specification](https://avalabs.org/docs/). 

Using Slopes, developers are able to:

  * Locally manage private keys
  * Retrieve balances on addresses
  * Get UTXOs for addresses
  * Build and sign transactions
  * Issue signed transactions to the AVM
  * Create a subnetwork
  * Administer a local node
  * Retrieve AVA network information from a node

The entirety of the Slopes documentation can be found on our [XXX Fix Link XXX Slopes documentation page](https://avalabs.org/docs/slopes).

### Importing essentials

```js
import * as slopes from "slopes";
import BN from 'bn.js';
import { Buffer } from 'buffer/'; // the slash forces this library over native Node.js Buffer

let bintools = slopes.BinTools.getInstance();
```

The above lines import the libraries used in this example:
  
  * slopes: Our javascript module
  * bn.js: A bignumber module use by slopes
  * buffer: A Buffer library 
  * BinTools: A singleton built into Slopes that is used for dealing with binary data

## Example 1 -- Managing AVM Keys

The AVM API exposed in Slopes comes with its own AVM Keychain. This keychain is used in the functions of the API, enabling them to sign using keys it's registered. The first step in this process is to create an instance of Slopes connected to our AVA Platform endpoint of choice.

```js
let ava = new slopes.Slopes("localhost", 9650, "https");
let avm = ava.AVM(); //returns a reference to the instance of the AVM used by Slopes
```

### Accessing the keychain

The keychain is accessed through the AVM API and can be referenced directly or through a reference varaible.

```js
let myKeychain = avm.keyChain();
```

This exposes the instance of the class AVMKeyChain which is created when the AVM API is created. Keys managed by this keychain are of type AVMKeyPair. At present, this supports secp256k1 curve for ECDSA key paris. 

### Creating keypairs

The keychain has the ability to create new keypairs for you and return the address assocated with the key pair.

```js
let newAddress = myKeychain.makeKey();
```

You may also import your exsting private key into the 

## Example 2 -- Creating An Asset

This example creates an asset in the AVM and publishes it to the AVA Platform. The first step in this process is to create an instance of Slopes connected to our AVA Platform endpoint of choice.

```js
let ava = new slopes.Slopes("localhost", 9650, "https");
let avm = ava.AVM(); //returns a reference to the instance of the AVM used by Slopes
```

### Describe the new asset

The first steps in creating a new asset using Slopes is to determine the qualties of the asset. We want to mint an asset with 100,000 coins and issue it to three known addresses we control. We require two of the three addresses to spend this output. 

*Note: This example assumes we have the keys already managed in our AVM Keychain. We are explicit with the addresses to demonstrate serialization.*

```js
// The amount to mint for the asset
let amount = new BN(100000)

// The addresses to issue the minted coins, in hex
let address1 = "c3344128e060128ede3523a24a461c8943ab0859";
let address2 = "51025c61fbcfc078f69334f834be6dd26d55a955";
let address3 = "B6D4v1VtPYLbiUvYXtW4Px8oE9imC2vGW"; //already serialized! Yay!

// The AVA addressing format requires base-58 with a checksum
// This serializes the addreses and places them into an array
// Note: "address3" is already seralized! Yay!
let addresses = [
    bintools.avaSerialize(Buffer.from(address1, "hex")),
    bintools.avaSerialize(Buffer.from(address2, "hex"))
    address3
];

// We require 2 addresses to sign in order to spend this initial asset's minted coins
let threshold = 2;
```

### Creating the signed transaction

Now that we know what we want an asset to look like, we create an output to send to the network. This process is fairly straight-forward:

  1. We instantiate an output of the type "Create Asset" populated with the desired parameters.
  2. We create an unsigned transaction from an array of inputs and outputs.
    * Inputs come from the UTXOs and are spent in a transaction.
    * In this case there are no unspent assets, so the input array is blank.
  3. We use our AVM Keychain to sign and return the signed transaction.

```js
//Create an output to issue to the network
let output = new slopes.OutCreateAsset(amount, addresses, threshold);
let unsigned = slopes.TxUnsigned([], [output]);
let signed = avm.keyChain().signTx(unsigned); //returns a Tx class
```

### Issue the signed transaction

Now that we have a signed transaction ready to send to the network, let's issue it! 

Using the Slopes AVM API, we going to call the issueTx function. This function can take either the Tx class returned in the previous step, a base-58 string AVA serialized representation of the transaction, or a raw Buffer class with the data for the transaction. Examples of each are below:

```js
// using the Tx class
let txid = avm.issueTx(signed); //returns an AVA serialized string for the TxID
```

```js
// using the base-58 representation
let txid = avm.issueTx(signed.toString()); //returns an AVA serialized string for the TxID
```

```js
// using the transaction Buffer
let txid = avm.issueTx(signed.toBuffer()); //returns an AVA serialized string for the TxID
```

We assume ONE of those methods are used to issue the transaction.

### Get the status of the transaction

Now that we sent the transaction to the network, it takes a few seconds to determine if the transaction has gone through. We can get an updated status on the transaction using the TxID through the AVM API.

```js
let status = avm.getTxStatus(txid); // returns one of: "Accepted", "Processing", "Unknown", and "Rejected"
```

The statuses can be one of "Accepted", "Processing", "Unknown", and "Rejected":
  * "Accepted" indicates that the transaction has been accepted as valid by the network and executed
  * "Processing" indicates that the transaction is being voted on.
  * "Unknown" indicates that node knows nothing about the transaction, indicating the node doesn't have it
  * "Rejected" indicates the node knows about the transaction, but it conflicted with an accepted transaction

