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
  ConvertSubnetToL1Tx,
  RegisterL1ValidatorTx,
  SetL1ValidatorWeightTx,
  IncreaseL1ValidatorBalanceTx,
  DisableL1ValidatorTx,
} from '../serializable/pvm';
import {
  baseTx,
  baseTxbytes,
  transferableInput,
  transferableInputBytes,
  transferableOutput,
  transferableOutputBytes,
} from './avax';
import {
  addresses,
  addressesBytes,
  id,
  idBytes,
  nodeId,
  nodeIdBytes,
} from './common';
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
  blsSignature,
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
import type { FeeState } from '../vms/pvm';
import { L1Validator } from '../serializable/fxs/pvm/L1Validator';
import { PChainOwner } from '../serializable/fxs/pvm/pChainOwner';

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

export const proofOfPossessionBytes = () =>
  concatBytes(blsPublicKeyBytes(), blsSignatureBytes());

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
    bigIntPr(),
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
    bigIntPrBytes(),
    byteByte(),
    intBytes(),
    bytesForInt(10),
    inputBytes(),
  );

export const pChainOwner = () => new PChainOwner(int(), addresses()());

export const pChainOwnerBytes = () =>
  concatBytes(
    intBytes(), // threshold
    addressesBytes(),
  );

export const l1Validator = () =>
  new L1Validator(
    bytes(),
    bigIntPr(),
    bigIntPr(),
    proofOfPossession(),
    pChainOwner(),
    pChainOwner(),
  );

export const l1ValidatorBytes = () =>
  concatBytes(
    bytesBytes(),
    bigIntPrBytes(),
    bigIntPrBytes(),
    proofOfPossessionBytes(),
    pChainOwnerBytes(),
    pChainOwnerBytes(),
  );

export const convertSubnetToL1Tx = () =>
  new ConvertSubnetToL1Tx(
    baseTx(),
    id(),
    id(),
    bytes(),
    makeList(l1Validator)(),
    input(),
  );

export const convertSubnetToL1TxBytes = () =>
  concatBytes(
    baseTxbytes(),
    idBytes(),
    idBytes(),
    bytesBytes(),
    makeListBytes(l1ValidatorBytes)(),
    bytesForInt(10),
    inputBytes(),
  );

export const registerL1ValidatorTx = () =>
  new RegisterL1ValidatorTx(baseTx(), bigIntPr(), blsSignature(), bytes());

export const registerL1ValidatorTxBytes = () =>
  concatBytes(
    baseTxbytes(),
    bigIntPrBytes(),
    blsSignatureBytes(),
    bytesBytes(),
  );

export const setL1ValidatorWeightTx = () =>
  new SetL1ValidatorWeightTx(baseTx(), bytes());

export const setL1ValidatorWeightTxBytes = () =>
  concatBytes(baseTxbytes(), bytesBytes());

export const increaseL1ValidatorBalanceTx = () =>
  new IncreaseL1ValidatorBalanceTx(baseTx(), id(), bigIntPr());

export const increaseL1ValidatorBalanceTxBytes = () =>
  concatBytes(baseTxbytes(), idBytes(), bigIntPrBytes());

export const disableL1ValidatorTx = () =>
  new DisableL1ValidatorTx(baseTx(), id(), input());

export const disableL1ValidatorTxBytes = () =>
  concatBytes(baseTxbytes(), idBytes(), bytesForInt(10), inputBytes());

export const feeState = (): FeeState => ({
  capacity: 999_999n,
  excess: 1n,
  price: 1n,
  timestamp: new Date().toISOString(),
});
