import {
  TransferableInput,
  TransferableOutput,
  UTXOID,
} from '../components/avax';
import { Int } from '../primatives/int';
import { merge } from '../utils/buffer';
import { id, idBytes } from './common';
import {
  transferInput,
  transferInputBytes,
  transferOutput,
  transferOutputBytes,
} from './secp256k1';
import { bytesForInt } from './utils/bytesFor';

// https://docs.avax.network/specs/avm-transaction-serialization#transferable-output-example
export const transferableOutputBytes = () =>
  merge([idBytes(), bytesForInt(7), transferOutputBytes()]);

export const transferableOutput = () =>
  new TransferableOutput(id(), transferOutput());

// https://docs.avax.network/specs/avm-transaction-serialization#transferable-input-example
export const transferableInputBytes = () =>
  merge([utxoIdBytes(), idBytes(), bytesForInt(5), transferInputBytes()]);

export const transferableInput = () =>
  new TransferableInput(utxoId(), id(), transferInput());

export const utxoIdBytes = () => merge([idBytes(), bytesForInt(5)]);

export const utxoId = () => new UTXOID(id(), new Int(5));
