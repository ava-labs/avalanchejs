import {
  WarpMessage,
  WarpSignature,
  WarpUnsignedMessage,
} from '../serializable/pvm/warp';
import { concatBytes } from '../utils';
import { id, idBytes } from './common';
import {
  blsSignature,
  blsSignatureBytes,
  bytes,
  bytesBytes,
  int,
  intBytes,
} from './primitives';
import { bytesForInt } from './utils/bytesFor';

export const warpUnsignedMessage = () =>
  new WarpUnsignedMessage(int(), id(), bytes());

export const warpUnsignedMessageBytes = () =>
  concatBytes(intBytes(), idBytes(), bytesBytes());

export const warpSignature = () => new WarpSignature(bytes(), blsSignature());

export const warpSignatureBytes = () =>
  concatBytes(bytesBytes(), blsSignatureBytes());

export const warpMessage = () =>
  new WarpMessage(warpUnsignedMessage(), warpSignature());

export const warpMessageBytes = () =>
  concatBytes(warpUnsignedMessageBytes(), bytesForInt(0), warpSignatureBytes());
