import { TransferableOutput } from '../components/avax';
import { merge } from '../utils/buffer';
import { transferOutput, transferOutputBytes } from './secp256k1';

// https://docs.avax.network/specs/avm-transaction-serialization#transferable-output-example
export const transferableOutputBytes = () =>
  merge([
    new Uint8Array([
      // assetID:
      0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
      0x0c, 0x0d, 0x0e, 0x0f, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17,
      0x18, 0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f,
      // typeID:
      0x00, 0x00, 0x00, 0x07,
    ]),
    transferOutputBytes(),
  ]);

export const transferableOutput = () =>
  new TransferableOutput(
    '0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
    transferOutput(),
  );
