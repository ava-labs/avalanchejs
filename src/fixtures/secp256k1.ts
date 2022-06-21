import {
  Input,
  MintOperation,
  MintOutput,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../fxs/secp256k1';
import { OutputOwnersList } from '../fxs/secp256k1/outputOwnersList';
import { Int } from '../primatives/int';
import { concatBytes } from '../utils/buffer';
import { addresses, addressesBytes } from './common';
import {
  bigIntPr,
  bigIntPrBytes,
  int,
  intBytes,
  ints,
  intsBytes,
} from './primatives';

// https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-mint-output-example
export const mintOutputBytes = () => outputOwnerBytes();

export const mintOutput = () => new MintOutput(outputOwner());

// https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-transfer-output
export const transferOutputBytes = () =>
  concatBytes(bigIntPrBytes(), outputOwnerBytes());

export const transferOutput = () =>
  new TransferOutput(bigIntPr(), outputOwner());

export const outputOwnerBytes = () =>
  concatBytes(
    // locktime:
    bigIntPrBytes(),
    // threshold:
    intBytes(),
    addressesBytes(),
  );

export const outputOwner = () =>
  new OutputOwners(bigIntPr(), int(), addresses());

export const inputBytes = () => intsBytes();

export const input = () => new Input(ints());

// https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-transfer-input-example
export const transferInputBytes = () =>
  concatBytes(bigIntPrBytes(), inputBytes());

export const transferInput = () => new TransferInput(bigIntPr(), input());

// https://docs.avax.network/specs/avm-transaction-serialization#secp256k1-mint-operation-example
export const mintOperationBytes = () =>
  concatBytes(inputBytes(), mintOutputBytes(), transferOutputBytes());

export const mintOperation = () =>
  new MintOperation(input(), new MintOutput(outputOwner()), transferOutput());

export const outputOwnersListBytes = () =>
  concatBytes(new Int(2).toBytes(), outputOwnerBytes(), outputOwnerBytes());

export const outputOwnersList = () =>
  new OutputOwnersList([outputOwner(), outputOwner()]);
