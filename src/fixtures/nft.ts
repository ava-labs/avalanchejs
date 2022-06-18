import { MintOperation, MintOutput, TransferOutput } from '../fxs/nft';
import { TransferOperation } from '../fxs/nft/transferOperation';
import { merge } from '../utils/buffer';
import { bytes, bytesBytes, int, intBytes } from './primatives';
import {
  input,
  inputBytes,
  outputOwner,
  outputOwnerBytes,
  outputOwnersList,
  outputOwnersListBytes,
} from './secp256k1';

// https://docs.avax.network/specs/avm-transaction-serialization/#nft-mint-output-example
export const mintOutputBytes = () => merge([intBytes(), outputOwnerBytes()]);

export const mintOutput = () => new MintOutput(int(), outputOwner());

// https://docs.avax.network/specs/avm-transaction-serialization/#nft-transfer-output-example
export const transferOutputBytes = () =>
  merge([intBytes(), bytesBytes(), outputOwnerBytes()]);

export const transferOutput = () =>
  new TransferOutput(int(), bytes(), outputOwner());

export const mintOperationBytes = () =>
  merge([inputBytes(), intBytes(), bytesBytes(), outputOwnersListBytes()]);
export const mintOperation = () =>
  new MintOperation(input(), int(), bytes(), outputOwnersList());

export const transferOperationBytes = () =>
  merge([inputBytes(), transferOutputBytes()]);

export const transferOperation = () =>
  new TransferOperation(input(), transferOutput());
