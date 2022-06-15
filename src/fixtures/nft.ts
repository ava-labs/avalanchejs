import { MintOperation, MintOutput, TransferOutput } from '../fxs/nft';
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
export const mintOutputBytes = () =>
  merge([
    new Uint8Array([
      // groupID:
      0x00, 0x00, 0x30, 0x39,
    ]),
    outputOwnerBytes(),
  ]);

export const mintOutput = () => new MintOutput(12345, outputOwner());

// https://docs.avax.network/specs/avm-transaction-serialization/#nft-transfer-output-example
export const transferOutputBytes = () =>
  merge([
    new Uint8Array([
      // groupID:
      0x00, 0x00, 0x30, 0x39,
      // length of payload:
      0x00, 0x00, 0x00, 0x03,
      // payload:
      0x43, 0x11, 0x00,
    ]),
    outputOwnerBytes(),
  ]);

export const transferOutput = () =>
  new TransferOutput(12345, new Uint8Array([0x43, 0x11, 0x00]), outputOwner());

export const mintOperationBytes = () =>
  merge([inputBytes(), intBytes(), bytesBytes(), outputOwnersListBytes()]);
export const mintOperation = () =>
  new MintOperation(input(), int(), bytes(), outputOwnersList());
