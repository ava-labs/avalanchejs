# AvalancheJS - The Avalanche Platform JavaScript Library

## Overview 

AvalancheJS is a JavaScript Library for interfacing with the Avalanche Platform. It is built using TypeScript and intended to support both browser and Node.js. The AvalancheJS library allows one to issue commands to the Avalanche node APIs. 

The APIs currently supported by default are:

  * Admin API
  * AVM API (X-Chain)
  * Health API
  * Info API
  * Keystore API
  * Metrics API
  * PlatformVM API

We built AvalancheJS with ease of use in mind. With this library, any Javascript developer is able to interact with a node on the Avalanche Platform who has enabled their API endpoints for the developer's consumption. We keep the library up-to-date with the latest changes in the [Avalanche Platform Specification](https://docs.avax.network). 

  Using AvalancheJS, developers can:

  * Locally manage private keys
  * Retrieve balances on addresses
  * Get UTXOs for addresses
  * Build and sign transactions
  * Issue signed transactions to the X-Chain
  * Create a Subnetwork
  * Administer a local node
  * Retrieve Avalanche network information from a node

### Requirements

AvalancheJS requires Node.js LTS version 12.14.1 or higher to compile.

### Installation

Avalanche is available for install via `npm`:

`npm install --save avalanche`

You can also pull the repo down directly and build it from scratch:

`npm run build`

This will generate a pure Javascript library and place it in a folder named "web" in the project root. The "avalanche.js" file can then be dropped into any project as a pure javascript implementation of Avalanche.

The AvalancheJS library can be imported into your existing Node.js project as follows:

```js
const avalanche = require("avalanche");
```
Or into your TypeScript project like this:

```js
import { Avalanche } from "avalanche"
```

### Importing essentials

```js
import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche"

let bintools = BinTools.getInstance();
```

The above lines import the libraries used in the tutorials. The libraries include:
  
  * avalanche: Our javascript module.
  * bn.js: A bignumber module use by AvalancheJS.
  * buffer: A Buffer library.
  * BinTools: A singleton built into AvalancheJS that is used for dealing with binary data.

## Example 1 &mdash; Managing X-Chain Keys

AvalancheJS comes with its own AVM Keychain. This KeyChain is used in the functions of the API, enabling them to sign using keys it's registered. The first step in this process is to create an instance of AvalancheJS connected to our Avalanche Platform endpoint of choice.

```js
import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche" 

let bintools = BinTools.getInstance();

let myNetworkID = 12345; //default is 3, we want to override that for our local network
let myBlockchainID = "GJABrZ9A6UQFpwjPU8MDxDd8vuyRoDVeDAXc694wJ5t3zEkhU"; // The X-Chain blockchainID on this network
let ava = new avalanche.Avalanche("localhost", 9650, "http", myNetworkID, myBlockchainID);
let xchain = ava.XChain(); //returns a reference to the X-Chain used by AvalancheJS
```

### Accessing the KeyChain

The KeyChain is accessed through the X-Chain and can be referenced directly or through a reference variable.

```js
let myKeychain = xchain.keyChain();
```

This exposes the instance of the class AVMKeyChain which is created when the X-Chain API is created. At present, this supports secp256k1 curve for ECDSA key pairs.

### Creating X-Chain key pairs

The KeyChain has the ability to create new KeyPairs for you and return the address assocated with the key pair.

```js
let newAddress1 = myKeychain.makeKey(); //returns a Buffer for the address
```

You may also import your exsting private key into the KeyChain using either a Buffer...

```js
let mypk = bintools.cb58Decode("24jUJ9vZexUM6expyMcT48LBx27k1m7xpraoV62oSQAHdziao5"); //returns a Buffer
let newAddress2 = myKeychain.importKey(mypk); //returns a Buffer for the address
```

... or an Avalanche serialized string works, too:

```js
let mypk = "24jUJ9vZexUM6expyMcT48LBx27k1m7xpraoV62oSQAHdziao5";
let newAddress2 = myKeychain.importKey(mypk); //returns a Buffer for the address
```

### Working with KeyChains

The X-Chains's KeyChain has standardized key management capabilities. The following functions are available on any KeyChain that implements this interface.

```js
let addresses = myKeychain.getAddresses(); //returns an array of Buffers for the addresses
let addressStrings = myKeychain.getAddressStrings(); //returns an array of strings for the addresses
let exists = myKeychain.hasKey(newAddress1); //returns true if the address is managed
let keypair = myKeychain.getKey(newAddress1); //returns the KeyPair class
```


### Working with KeyPairs

The X-Chain's KeyPair has standardized KeyPair functionality. The following operations are available on any KeyPair that implements this interface.

```js
let address = keypair.getAddress(); //returns Buffer
let addressString = keypair.getAddressString(); //returns string

let pubk = keypair.getPublicKey(); //returns Buffer
let pubkstr = keypair.getPublicKeyString(); //returns a CB58 encoded string

let privk = keypair.getPrivateKey(); //returns Buffer
let privkstr = keypair.getPrivateKeyString(); //returns a CB58 encoded string

keypair.generateKey(); //creates a new random KeyPair

let mypk = "24jUJ9vZexUM6expyMcT48LBx27k1m7xpraoV62oSQAHdziao5";
let successul = keypair.importKey(mypk); //returns boolean if private key imported successfully

let message = Buffer.from("Wubalubadubdub");
let signature = keypair.sign(message); //returns a Buffer with the signature

let signerPubk = keypair.recover(message, signature);
let isValid = keypair.verify(message, signature); //returns a boolean
```

## Example 2 &mdash; Creating An Asset

This example creates an asset in the X-Chain and publishes it to the Avalanche Platform. The first step in this process is to create an instance of AvalancheJS connected to our Avalanche Platform endpoint of choice.

```js

import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche" 
import {
    InitialStates,
    SECPTransferOutput
  } from "avalanche/dist/apis/avm"

let myNetworkID = 12345; //default is 3, we want to override that for our local network
let myBlockchainID = "GJABrZ9A6UQFpwjPU8MDxDd8vuyRoDVeDAXc694wJ5t3zEkhU"; // The X-Chain blockchainID on this network
let avax = new Avalanche("localhost", 9650, "http", myNetworkID, myBlockchainID);
let xchain = avax.XChain(); //returns a reference to the X-Chain used by AvalancheJS
```

### Describe the new asset

The first steps in creating a new asset using AvalancheJS is to determine the qualities of the asset. We will give the asset a name, a ticker symbol, as well as a denomination. 

```js
// Name our new coin and give it a symbol
let name = "Rickcoin is the most intelligent coin";
let symbol = "RICK";

// Where is the decimal point indicate what 1 asset is and where fractional assets begin
// Ex: 1 AVAX is denomination 9, so the smallest unit of AVAX is nanoAVAX (nAVAX) at 10^-9 AVAX
let denomination = 9;
```

### Creating the initial state

We want to mint an asset with 400 coins to all of our managed keys, 500 to the second address we know of, and 600 to the second and third address. This sets up the state that will result from the Create Asset transaction. 

*Note: This example assumes we have the keys already managed in our X-Chain's Keychain.*

```js
let addresses = xchain.keyChain().getAddresses();

// Create outputs for the asset's initial state
let secpOutput1 = new SECPTransferOutput(new BN(400), new BN(400), 1, addresses);
let secpOutput2 = new SECPTransferOutput(new BN(500), new BN(400), 1, [addresses[1]]);
let secpOutput3 = new SECPTransferOutput(new BN(600), new BN(400), 1, [addresses[1], addresses[2]]);

// Populate the initialStates with the outputs
let initialState = new InitialStates();
initialState.addOutput(secpOutput1);
initialState.addOutput(secpOutput2);
initialState.addOutput(secpOutput3);
```

### Creating the signed transaction

Now that we know what we want an asset to look like, we create an output to send to the network. There is an AVM helper function `buildCreateAssetTx()` which does just that. 

```js
// Fetch the UTXOSet for our addresses
let utxos = await xchain.getUTXOs(addresses);

// Make an unsigned Create Asset transaction from the data compiled earlier
let unsigned = await xchain.buildCreateAssetTx(
  utxos, // the UTXOSet containing the UTXOs we're going to spend
  addresses, // the addresses which will pay the fees
  addresses, // the addresses which recieve the change from the spent UTXOs
  initialState, // the initial state to be created for this new asset 
  name, // the full name of the asset
  symbol, // a short ticker symbol for the asset
  denomination // the asse's denomination 
);

let signed = xchain.keyChain().signTx(unsigned); //returns a Tx class
```

### Issue the signed transaction

Now that we have a signed transaction ready to send to the network, let's issue it! 

Using the AvalancheJS X-Chain API, we going to call the issueTx function. This function can take either the Tx class returned in the previous step, a CB58 representation of the transaction, or a raw Buffer class with the data for the transaction. Examples of each are below:

```js
// using the Tx class
let txid = await xchain.issueTx(signed); //returns a CB58 serialized string for the TxID
```

```js
// using the base-58 representation
let txid = await xchain.issueTx(signed.toString()); //returns a CB58 serialized string for the TxID
```

```js
// using the transaction Buffer
let txid = await xchain.issueTx(signed.toBuffer()); //returns a CB58 serialized string for the TxID
```

We assume ONE of those methods are used to issue the transaction.

### Get the status of the transaction

Now that we sent the transaction to the network, it takes a few seconds to determine if the transaction has gone through. We can get an updated status on the transaction using the TxID through the AVM API.

```js
// returns one of: "Accepted", "Processing", "Unknown", and "Rejected"
let status = await xchain.getTxStatus(txid); 
```

The statuses can be one of "Accepted", "Processing", "Unknown", and "Rejected":

  * "Accepted" indicates that the transaction has been accepted as valid by the network and executed
  * "Processing" indicates that the transaction is being voted on.
  * "Unknown" indicates that node knows nothing about the transaction, indicating the node doesn't have it
  * "Rejected" indicates the node knows about the transaction, but it conflicted with an accepted transaction

### Identifying the newly created asset

The X-Chain uses the TxID of the transaction which created the asset as the unique identifier for the asset. This unique identifier is henceforth known as the "AssetID" of the asset. When assets are traded around the X-Chain, they always reference the AssetID that they represent.

## Example 3 &mdash; Sending An Asset

This example sends an asset in the X-Chain to a single recipient. The first step in this process is to create an instance of Avalanche connected to our Avalanche Platform endpoint of choice.

```js
import {
    Avalanche,
    BinTools,
    Buffer,
    BN
  } from "avalanche" 

let myNetworkID = 1; //default is 3, we want to override that for our local network
let myBlockchainID = "GJABrZ9A6UQFpwjPU8MDxDd8vuyRoDVeDAXc694wJ5t3zEkhU"; // The X-Chain blockchainID on this network
let avax = new avalanche.Avalanche("localhost", 9650, "http", myNetworkID, myBlockchainID);
let xchain = avax.XChain(); //returns a reference to the X-Chain used by AvalancheJS
```

We're also assuming that the keystore contains a list of addresses used in this transaction.

### Getting the UTXO Set

The X-Chain stores all available balances in a datastore called Unspent Transaction Outputs (UTXOs). A UTXO Set is the unique list of outputs produced by transactions, addresses that can spend those outputs, and other variables such as lockout times (a timestamp after which the output can be spent) and thresholds (how many signers are required to spend the output). 

For the case of this example, we're going to create a simple transaction that spends an amount of available coins and sends it to a single address without any restrictions. The management of the UTXOs will mostly be abstracted away. 

However, we do need to get the UTXO Set for the addresses we're managing. 

```js
let myAddresses = xchain.keyChain().getAddresses(); //returns an array of addresses the KeyChain manages
let addressStrings = xchain.keyChain().getAddressStrings(); //returns an array of addresses the KeyChain manages as strings
let utxos = await xchain.getUTXOs(myAddresses);
```

### Spending the UTXOs

The `buildBaseTx()` helper function sends a single asset type. We have a particular assetID whose coins we want to send to a recipient address. This is an imaginary asset for this example which we believe to have 400 coins. Let's verify that we have the funds available for the transaction.

```js
let assetid = "23wKfz3viWLmjWo2UZ7xWegjvnZFenGAVkouwQCeB9ubPXodG6"; //avaSerialized string
let mybalance = utxos.getBalance(myAddresses, assetid); //returns 400 as a BN
```
We have 400 coins! We're going to now send 100 of those coins to our friend's address.

```js
let sendAmount = new BN(100); //amounts are in BN format
let friendsAddress = "X-avax1k26jvfdzyukms95puxcceyzsa3lzwf5ftt0fjk"; // address format is Bech32

//The below returns a UnsignedTx
//Parameters sent are (in order of appearance):
//   * The UTXO Set
//   * The amount being sent as a BN
//   * An array of addresses to send the funds
//   * An array of addresses sending the funds
//   * An array of addresses any leftover funds are sent
//   * The AssetID of the funds being sent
let unsignedTx = await xchain.buildBaseTx(utxos, sendAmount, [friendsAddress], addressStrings, addressStrings, assetid);
let signedTx = xchain.signTx(unsignedTx);
let txid = await xchain.issueTx(signedTx);
```

And the transaction is sent!

### Get the status of the transaction

Now that we sent the transaction to the network, it takes a few seconds to determine if the transaction has gone through. We can get an updated status on the transaction using the TxID through the X-Chain.

```js
// returns one of: "Accepted", "Processing", "Unknown", and "Rejected"
let status = await xchain.getTxStatus(txid);
```

The statuses can be one of "Accepted", "Processing", "Unknown", and "Rejected":

  * "Accepted" indicates that the transaction has been accepted as valid by the network and executed
  * "Processing" indicates that the transaction is being voted on.
  * "Unknown" indicates that node knows nothing about the transaction, indicating the node doesn't have it
  * "Rejected" indicates the node knows about the transaction, but it conflicted with an accepted transaction

### Check the results

The transaction finally came back as "Accepted", now let's update the UTXOSet and verify that the transaction balance is as we expected. 

*Note: In a real network the balance isn't guaranteed to match this scenario. Transaction fees or additional spends may vary the balance. For the purpose of this example, we assume neither of those cases.*

```js
let updatedUTXOs = await xchain.getUTXOs();
let newBalance = updatedUTXOs.getBalance(myAddresses, assetid);
if(newBalance.toNumber() != mybalance.sub(sendAmount).toNumber()){
    throw Error("heyyy these should equal!");
}
```

## Creating a new AvalancheJS build

First, all changes to the `master` branch of the AvalancheJS repo should be done solely via github pull requests. This is to ensure that only code which has been peer-reviewed ends up in `master`. Next, you need your username added to the [`avalanche` npm package](https://www.npmjs.com/package/avalanche) and also confirm that you enable 2fa on your npm account.

After all the desired changes have been peer-reviewed and merged into the `development` branch then create a final PR to merge `development` in to `master`. Name the PR the new AvalancheJS version name. Ex: `v3.0.4`. In the description list a changelog of the changes which are included in the PR.

When you merge the PR and the latest and greatest are on the `master` branch then run `npm run release:prepare`. This command removes the existing `dist/` and `node_modules/` directories in addition to removing the `package-lock.json` file. Next it installs the dependencies, builds AvalancheJS, bundles the build with webpack and runs the test suite. If all of this is successful then you are ready to push a new build to npm.

For this we use the [`np` lib](https://www.npmjs.com/package/np) to push a new build to npm. `np` will prompt you to answer if this is a PATCH, MINOR or MAJOR release and it will handle bumping the version in `package.json` for you. You will be prompted for your `OTP` which stands for "one time password." This is your 2fa code which you will get from having enabled 2fa on your npm account.

After this is successful you can confirm that the version number was bumped for the npm [`avalanche` npm package](https://www.npmjs.com/package/avalanche). Once you confirm that then the final step is to merge `master` in to the `development` branch. This ensures that the newly bumped version gets added to any future dev work which branches off of `development`.