import {
  MintOperation,
  MintOutput,
  TransferOutput,
} from '../serializable/fxs/nft';
import { bytes, bytesBytes, int, intBytes } from './primitives';
import { TransferOperation } from '../serializable/fxs/nft/transferOperation';
import { concatBytes } from '../utils/buffer';
import {
  input,
  inputBytes,
  outputOwner,
  outputOwnerBytes,
  outputOwnersList,
  outputOwnersListBytes,
} from './secp256k1';

// https://docs.avax.network/specs/avm-transaction-serialization/#nft-mint-output-example
export const mintOutputBytes = () =>
  concatBytes(intBytes(), outputOwnerBytes());

export const mintOutput = () => new MintOutput(int(), outputOwner());

// https://docs.avax.network/specs/avm-transaction-serialization/#nft-transfer-output-example
export const transferOutputBytes = () =>
  concatBytes(intBytes(), bytesBytes(), outputOwnerBytes());

export const transferOutput = () =>
  new TransferOutput(int(), bytes(), outputOwner());

export const mintOperationBytes = () =>
  concatBytes(inputBytes(), intBytes(), bytesBytes(), outputOwnersListBytes());
export const mintOperation = () =>
  new MintOperation(input(), int(), bytes(), outputOwnersList());

export const transferOperationBytes = () =>
  concatBytes(inputBytes(), transferOutputBytes());

export const transferOperation = () =>
  new TransferOperation(input(), transferOutput());
