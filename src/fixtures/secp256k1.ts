import {
  Input,
  MintOperation,
  MintOutput,
  OutputOwners,
  TransferInput,
  TransferOutput,
} from '../serializable/fxs/secp256k1';
import { Credential } from '../serializable/fxs/secp256k1/credential';
import { OutputOwnersList } from '../serializable/fxs/secp256k1/outputOwnersList';
import { Signature } from '../serializable/fxs/secp256k1/signature';
import { concatBytes, hexToBuffer } from '../utils/buffer';
import { addresses, addressesBytes } from './common';
import {
  bigIntPr,
  bigIntPrBytes,
  int,
  intBytes,
  ints,
  intsBytes,
} from './primitives';
import { bytesForInt } from './utils/bytesFor';

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
  new OutputOwners(bigIntPr(), int(), addresses()());

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
  concatBytes(bytesForInt(2), outputOwnerBytes(), outputOwnerBytes());

export const outputOwnersList = () =>
  new OutputOwnersList([outputOwner(), outputOwner()]);

export const signatureBytes = () =>
  new Uint8Array([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
    0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1e, 0x1d, 0x1f, 0x20, 0x21, 0x22, 0x23,
    0x24, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x2b, 0x2c, 0x2e, 0x2d, 0x2f,
    0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3a, 0x3b,
    0x3c, 0x3d, 0x3e, 0x3f, 0x00,
  ]);

export const signature2Bytes = () =>
  new Uint8Array([
    0x40, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a, 0x4b,
    0x4c, 0x4d, 0x4e, 0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56, 0x57,
    0x58, 0x59, 0x5a, 0x5b, 0x5c, 0x5e, 0x5d, 0x5f, 0x60, 0x61, 0x62, 0x63,
    0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6a, 0x6b, 0x6c, 0x6e, 0x6d, 0x6f,
    0x70, 0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x7b,
    0x7c, 0x7d, 0x7e, 0x7f, 0x00,
  ]);

export const signature = () =>
  new Signature(
    hexToBuffer(
      '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1e1d1f202122232425262728292a2b2c2e2d2f303132333435363738393a3b3c3d3e3f00',
    ),
  );

export const signature2 = () =>
  new Signature(
    hexToBuffer(
      '0x404142434445464748494a4b4c4d4e4f505152535455565758595a5b5c5e5d5f606162636465666768696a6b6c6e6d6f707172737475767778797a7b7c7d7e7f00',
    ),
  );

export const credentialBytes = () =>
  concatBytes(bytesForInt(2), signatureBytes(), signature2Bytes());
export const credential = () => new Credential([signature(), signature2()]);
