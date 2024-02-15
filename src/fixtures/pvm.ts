import { concatBytes } from '@noble/hashes/utils';
import {
  AddDelegatorTx,
  AddPermissionlessDelegatorTx,
  AddPermissionlessValidatorTx,
  AddSubnetValidatorTx,
  AddValidatorTx,
  AdvanceTimeTx,
  CreateChainTx,
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  ProofOfPossession,
  Signer,
  StakeableLockIn,
  StakeableLockOut,
  SubnetValidator,
  Validator,
  RemoveSubnetValidatorTx,
  TransferSubnetOwnershipTx,
  TransformSubnetTx,
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
  blsPublicKeyBytes,
  blsSignatureBytes,
  stringPr,
  stringPrBytes,
  byte,
  byteByte,
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
export const removeValidatorTx = () =>
  new RemoveSubnetValidatorTx(baseTx(), nodeId(), id(), input());

export const createSubnetTxBytes = () =>
  concatBytes(baseTxbytes(), bytesForInt(11), outputOwnerBytes());

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

export const removeSubnetValidatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    nodeIdBytes(),
    idBytes(),
    bytesForInt(10),
    inputBytes(),
  );

export const stakeableLockIn = () =>
  new StakeableLockIn(bigIntPr(), transferInput());

export const stakeableLockInBytes = () =>
  concatBytes(bigIntPrBytes(), bytesForInt(5), transferInputBytes());

export const stakeableLockOut = () =>
  new StakeableLockOut(bigIntPr(), transferOutput());

export const stakeableLockOutBytes = () =>
  concatBytes(bigIntPrBytes(), bytesForInt(7), transferOutputBytes());

export const advanceTimeTx = () => new AdvanceTimeTx(bigIntPr());

export const advanceTimeBytesTx = () => bigIntPrBytes();

export const proofOfPossession = () =>
  new ProofOfPossession(blsPublicKeyBytes(), blsSignatureBytes());

export const signer = () => new Signer(proofOfPossession());
export const signerBytes = () =>
  concatBytes(blsPublicKeyBytes(), blsSignatureBytes());

export const addPermissionlessValidatorTx = () =>
  new AddPermissionlessValidatorTx(
    baseTx(),
    subnetValidator(),
    signer(),
    makeList(transferableOutput)(),
    outputOwner(),
    outputOwner(),
    int(),
  );

export const addPermissionlessValidatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    subnetValidatorBytes(),
    bytesForInt(28),
    signerBytes(),
    makeListBytes(transferableOutputBytes)(),
    bytesForInt(11),
    outputOwnerBytes(),
    bytesForInt(11),
    outputOwnerBytes(),
    intBytes(),
  );

export const addPermissionlessDelegatorTx = () =>
  new AddPermissionlessDelegatorTx(
    baseTx(),
    subnetValidator(),
    makeList(transferableOutput)(),
    outputOwner(),
  );

export const addPermissionlessDelegatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    subnetValidatorBytes(),
    makeListBytes(transferableOutputBytes)(),
    bytesForInt(11),
    outputOwnerBytes(),
  );

export const transferSubnetOwnershipTx = () =>
  new TransferSubnetOwnershipTx(baseTx(), id(), input(), outputOwner());

export const transferSubnetOwnershipTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    bytesForInt(10),
    inputBytes(),
    bytesForInt(11),
    outputOwnerBytes(),
  );

export const transformSubnetTx = () =>
  new TransformSubnetTx(
    baseTx(),
    id(),
    id(),
    bigIntPr(),
    bigIntPr(),
    bigIntPr(),
    bigIntPr(),
    bigIntPr(),
    bigIntPr(),
    int(),
    int(),
    int(),
    int(),
    byte(),
    int(),
    input(),
  );

export const transformSubnetTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    idBytes(),
    bigIntPrBytes(),
    bigIntPrBytes(),
    bigIntPrBytes(),
    bigIntPrBytes(),
    bigIntPrBytes(),
    bigIntPrBytes(),
    intBytes(),
    intBytes(),
    intBytes(),
    intBytes(),
    byteByte(),
    intBytes(),
    bytesForInt(10),
    inputBytes(),
  );
