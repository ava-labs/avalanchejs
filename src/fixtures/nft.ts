import { MintOutput, TransferOutput } from '../fxs/nft';
import { outputOwner, outputOwnerBytes } from './secp256k1';

export const mintOutputBytes = () =>
  new Uint8Array([
    // groupID:
    0x00,
    0x00,
    0x30,
    0x39,
    //outputOwner:
    ...outputOwnerBytes(),
  ]);

export const mintOutput = () => new MintOutput(12345, outputOwner());

export const transferOutputBytes = () =>
  new Uint8Array([
    // groupID:
    0x00,
    0x00,
    0x30,
    0x39,
    // length of payload:
    0x00,
    0x00,
    0x00,
    0x03,
    // payload:
    0x43,
    0x11,
    0x00,
    //output owner:
    ...outputOwnerBytes(),
  ]);

export const transferOutput = () =>
  new TransferOutput(12345, new Uint8Array([0x43, 0x11, 0x00]), outputOwner());
