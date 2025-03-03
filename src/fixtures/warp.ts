import { Int } from '../serializable/primitives';
import {
  WarpMessage,
  WarpSignature,
  WarpUnsignedMessage,
} from '../serializable/pvm/warp';
import {
  AddressedCall,
  L1ValidatorWeightMessage,
} from '../serializable/pvm/warp/addressedCall';
import { L1ValidatorRegistrationMessage } from '../serializable/pvm/warp/addressedCall/messages/l1ValidatorRegistrationMessage';
import { RegisterL1ValidatorMessage } from '../serializable/pvm/warp/addressedCall/messages/registerL1ValidatorMessage';
import { SubnetToL1ConversionMessage } from '../serializable/pvm/warp/addressedCall/messages/subnetToL1ConversionMessage';
import { ConversionData } from '../serializable/pvm/warp/addressedCall/utils/conversionData';
import { ValidatorData } from '../serializable/pvm/warp/addressedCall/utils/validatorData';
import { concatBytes } from '../utils';
import {
  address,
  addressBytes,
  id,
  idBytes,
  nodeId,
  nodeIdBytes,
} from './common';
import {
  bigIntPr,
  bigIntPrBytes,
  blsPublicKey,
  blsPublicKeyBytes,
  blsSignature,
  blsSignatureBytes,
  bool,
  boolBytes,
  bytes,
  bytesBytes,
  int,
  intBytes,
} from './primitives';
import { pChainOwner, pChainOwnerBytes } from './pvm';
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

export const registerL1ValidatorMessage = () =>
  new RegisterL1ValidatorMessage(
    id(),
    nodeId(),
    blsPublicKey(),
    bigIntPr(),
    pChainOwner(),
    pChainOwner(),
    bigIntPr(),
  );

export const registerL1ValidatorMessageBytes = () =>
  concatBytes(
    new Int(1).toBytes(), // typeId
    idBytes(),
    bytesForInt(nodeIdBytes().length),
    nodeIdBytes(),
    blsPublicKeyBytes(),
    bigIntPrBytes(),
    pChainOwnerBytes(),
    pChainOwnerBytes(),
    bigIntPrBytes(),
  );

export const l1ValidatorWeightMessage = () =>
  new L1ValidatorWeightMessage(id(), bigIntPr(), bigIntPr());

export const l1ValidatorWeightMessageBytes = () =>
  concatBytes(
    new Int(3).toBytes(), // typeId
    idBytes(),
    bigIntPrBytes(),
    bigIntPrBytes(),
  );

export const addressedCall = () => new AddressedCall(address(), bytes());

export const addressedCallBytes = () =>
  concatBytes(
    new Int(1).toBytes(), // typeId
    bytesForInt(addressBytes().length),
    addressBytes(),
    bytesBytes(),
  );

export const l1ValidatorRegistrationMessage = () =>
  new L1ValidatorRegistrationMessage(id(), bool());

export const l1ValidatorRegistrationMessageBytes = () =>
  concatBytes(
    new Int(2).toBytes(), // typeId
    idBytes(),
    boolBytes(),
  );

export const subnetToL1ConversionMessage = () =>
  new SubnetToL1ConversionMessage(id());

export const subnetToL1ConversionMessageBytes = () =>
  concatBytes(
    new Int(0).toBytes(), // typeId
    idBytes(),
  );

export const validatorData = () =>
  new ValidatorData(nodeId(), blsPublicKey(), bigIntPr());

export const validatorDataBytes = () =>
  concatBytes(
    bytesForInt(nodeIdBytes().length),
    nodeIdBytes(),
    blsPublicKeyBytes(),
    bigIntPrBytes(),
  );

export const conversionData = () =>
  new ConversionData(id(), id(), address(), [validatorData()]);

export const conversionDataBytes = () =>
  concatBytes(
    idBytes(),
    idBytes(),
    bytesForInt(addressBytes().length),
    addressBytes(),
    bytesForInt(validatorDataBytes().length + 4), // size of validators + length of numValidators
    bytesForInt(1), // numValidators
    validatorDataBytes(),
  );
