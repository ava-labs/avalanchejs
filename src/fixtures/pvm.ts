import { concatBytes } from '@noble/hashes/utils';
import {
  AddDelegatorTx,
  AddSubnetValidatorTx,
  AddValidatorTx,
  AdvanceTimeTx,
  CreateChainTx,
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  StakableLockIn,
  StakableLockOut,
  SubnetValidator,
  Validator,
} from '../serializable/pvm';

import {
  baseTx,
  baseTxbytes,
  transferableInput,
  transferableInputBytes,
  transferableOutput,
  transferableOutputBytes,
} from './avax';
import { id, idBytes, nodeId, nodeIdBytes } from './common';
import {
  bigIntPr,
  bigIntPrBytes,
  bytes,
  bytesBytes,
  int,
  intBytes,
  stringPr,
  stringPrBytes,
} from './primitives';
import {
  input,
  inputBytes,
  outputOwner,
  outputOwnerBytes,
  transferInput,
  transferInputBytes,
  transferOutput,
  transferOutputBytes,
} from './secp256k1';
import { bytesForInt } from './utils/bytesFor';
import { makeList, makeListBytes } from './utils/makeList';
export const validator = () =>
  new Validator(nodeId(), bigIntPr(), bigIntPr(), bigIntPr());

export const validatorBytes = () =>
  concatBytes(nodeIdBytes(), bigIntPrBytes(), bigIntPrBytes(), bigIntPrBytes());

export const addValidatorTx = () =>
  new AddValidatorTx(
    baseTx(),
    validator(),
    makeList(transferableOutput)(),
    outputOwner(),
    int(),
  );
export const addValidatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    validatorBytes(),
    makeListBytes(transferableOutputBytes)(),
    bytesForInt(11),
    outputOwnerBytes(),
    intBytes(),
  );

export const subnetValidator = () => new SubnetValidator(validator(), id());

export const subnetValidatorBytes = () =>
  concatBytes(validatorBytes(), idBytes());

export const addSubnetValidatorTx = () =>
  new AddSubnetValidatorTx(baseTx(), subnetValidator(), input());

export const addSubnetValidatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    subnetValidatorBytes(),
    bytesForInt(10),
    inputBytes(),
  );

export const addDelegatorTx = () =>
  new AddDelegatorTx(
    baseTx(),
    validator(),
    makeList(transferableOutput)(),
    outputOwner(),
  );

export const addDelegatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    validatorBytes(),
    makeListBytes(transferableOutputBytes)(),
    bytesForInt(11),
    outputOwnerBytes(),
  );

export const createChainTx = () =>
  new CreateChainTx(
    baseTx(),
    id(),
    stringPr(),
    id(),
    makeList(id)(),
    bytes(),
    input(),
  );

export const createChainTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    stringPrBytes(),
    idBytes(),
    makeListBytes(idBytes)(),
    bytesBytes(),
    bytesForInt(10),
    inputBytes(),
  );

export const createSubnetTx = () => new CreateSubnetTx(baseTx(), outputOwner());

export const createSubnetTxBytes = () =>
  concatBytes(baseTxbytes(), outputOwnerBytes());

export const importTx = () =>
  new ImportTx(baseTx(), id(), makeList(transferableInput)());

export const importTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    makeListBytes(transferableInputBytes)(),
  );

export const exportTx = () =>
  new ExportTx(baseTx(), id(), makeList(transferableOutput)());

export const exportTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    makeListBytes(transferableOutputBytes)(),
  );

export const stakableLockIn = () =>
  new StakableLockIn(bigIntPr(), transferInput());

export const stakableLockInBytes = () =>
  concatBytes(bigIntPrBytes(), bytesForInt(5), transferInputBytes());

export const stakableLockOut = () =>
  new StakableLockOut(bigIntPr(), transferOutput());

export const stakableLockOutBytes = () =>
  concatBytes(bigIntPrBytes(), bytesForInt(7), transferOutputBytes());

export const advanceTimeTx = () => new AdvanceTimeTx(bigIntPr());

export const advanceTimeBytesTx = () => bigIntPrBytes();
