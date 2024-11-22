import {
  AddressedCall,
  WarpMessage,
  WarpSignature,
  WarpUnsignedMessage,
} from '../serializable/pvm/warp';
import { L1ValidatorWeight } from '../serializable/pvm/warp/message/l1ValidatorWeight';
import { Hash } from '../serializable/pvm/warp/payload/hash';
import { concatBytes } from '../utils';
import { address, addressBytes, id, idBytes } from './common';
import {
  bigIntPr,
  bigIntPrBytes,
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

export const l1ValidatorWeight = () =>
  new L1ValidatorWeight(id(), bigIntPr(), bigIntPr());

export const l1ValidatorWeightBytes = () =>
  concatBytes(idBytes(), bigIntPrBytes(), bigIntPrBytes());

export const hash = () => new Hash(id());

export const hashBytes = () => concatBytes(idBytes());

export const addressedCall = () => new AddressedCall(address(), bytes());

export const addressedCallBytes = () =>
  concatBytes(addressBytes(), bytesBytes());
