# AvalancheJS - The Avalanche Platform JavaScript Library

## Overview

AvalancheJS is a JavaScript Library for interfacing with the Avalanche Platform. It is built using TypeScript and intended to support both browser and Node.js. The AvalancheJS library allows you to issue commands to the Avalanche node APIs.

Using AvalancheJS, developers can:

- Retrieve balances on addresses
- Get UTXOs for addresses
- Build and sign transactions
- Issue signed transactions to the X-Chain, P-Chain, and C-Chain
- Perform cross-chain swaps between the X, P and C chains
- Add Validators and Delegators
- Create Subnets and Blockchains

### Requirements

AvalancheJS requires Node.js LTS version 20.11.1 or higher to compile.

## Installation

### Using the NPM Package

Add AvalancheJS to your project via `npm` or `yarn`.

For installing via `npm`:

`npm install --save @avalabs/avalanchejs`

For installing via `yarn`:

`yarn add @avalabs/avalanchejs`

### Build from Repository

You can also pull the repo down directly and build it from scratch.

Clone the AvalancheJS repository:

`git clone https://github.com/ava-labs/avalanchejs.git`

Then build it:

`npm run build`

or

`yarn build`

## Use AvalancheJS in Projects

The AvalancheJS library can be imported into your existing project as follows:

```ts
import { avm, pvm, evm } from '@avalabs/avalanchejs';
```

## Importing Essentials

```ts
import { avm /** X-chain */, pvm /** P-chain */, evm /** C-chain */, utils, secp256k1 } from "@avalabs/avalanchejs"

// example calls
const exportTx = avm.newExportTx(...) // constructs a new export tx from X
const addValidatorTx = pvm.newAddPermissionlessValidatorTx(...) // constructs a new add validator tx on P
const importTx = evm.newImportTx(...) // constructs a new import tx to C

const publicKeyBytes = utils.hexToBuffer(publicKeyHex)
const signature = secp256k1.signHash(bytes, privateKeyBytes)
```

Please check out the `examples` folder for more info.
