import {
  PUBLIC_KEY_LENGTH,
  SIGNATURE_LENGTH as BLS_SIGNATURE_LENGTH,
} from '../../../../crypto/bls';
import { SIGNATURE_LENGTH } from '../../../../crypto/secp256k1';
import type { OutputOwners } from '../../../../serializable';
import { Input } from '../../../../serializable/fxs/secp256k1';
import {
  type BaseTx,
  type TransferableInput,
  type TransferableOutput,
} from '../../../../serializable/avax';
import type {
  AddPermissionlessDelegatorTx,
  AddPermissionlessValidatorTx,
  AddSubnetValidatorTx,
  BaseTx as PvmBaseTx,
  CreateChainTx,
  CreateSubnetTx,
  ExportTx,
  ImportTx,
  RemoveSubnetValidatorTx,
  Signer,
  TransferSubnetOwnershipTx,
} from '../../../../serializable/pvm';
import {
  SignerEmpty,
  isAddPermissionlessDelegatorTx,
  isAddPermissionlessValidatorTx,
  isAddSubnetValidatorTx,
  isCreateChainTx,
  isCreateSubnetTx,
  isExportTx,
  isImportTx,
  isPvmBaseTx,
  isRemoveSubnetValidatorTx,
  isTransferSubnetOwnershipTx,
} from '../../../../serializable/pvm';
import {
  isStakeableLockIn,
  isStakeableLockOut,
  isTransferOut,
} from '../../../../utils';
import type { Dimensions } from '../../../common/fees/dimensions';
import {
  FeeDimensions,
  addDimensions,
  getEmptyDimensions,
  makeDimensions,
} from '../../../common/fees/dimensions';
import type { Serializable } from '../../../common/types';
import type { Transaction } from '../../../common';

/**
 * Number of bytes per long.
 */
const LONG_LEN = 8;

const ID_LEN = 32;

/**
 * Number of bytes per short.
 */
const SHORT_LEN = 2;

const SHORT_ID_LEN = 20;

/**
 * Number of bytes per int.
 */
const INT_LEN = 4;

const INTRINSIC_VALIDATOR_BANDWIDTH =
  SHORT_ID_LEN + // Node ID (Short ID = 20)
  LONG_LEN + // Start
  LONG_LEN + // End
  LONG_LEN; // Weight

const INTRINSIC_SUBNET_VALIDATOR_BANDWIDTH =
  INTRINSIC_VALIDATOR_BANDWIDTH + // Validator
  ID_LEN; // Subnet ID (ID Length = 32)

const INTRINSIC_OUTPUT_BANDWIDTH =
  ID_LEN + // assetID
  INT_LEN; // output typeID

const INTRINSIC_STAKEABLE_LOCKED_OUTPUT_BANDWIDTH =
  LONG_LEN + // locktime
  INT_LEN; // output typeID

const INTRINSIC_SECP256K1_FX_OUTPUT_OWNERS_BANDWIDTH =
  LONG_LEN + // locktime
  INT_LEN + // threshold
  INT_LEN; // number of addresses

const INTRINSIC_SECP256K1_FX_OUTPUT_BANDWIDTH =
  LONG_LEN + // amount
  INTRINSIC_SECP256K1_FX_OUTPUT_OWNERS_BANDWIDTH;

const INTRINSIC_INPUT_BANDWIDTH =
  ID_LEN + // txID
  INT_LEN + // output index
  ID_LEN + // assetID
  INT_LEN + // input typeID
  INT_LEN; // credential typeID

const INTRINSIC_STAKEABLE_LOCKED_INPUT_BANDWIDTH =
  LONG_LEN + // locktime
  INT_LEN; // input typeID

const INTRINSIC_SECP256K1_FX_INPUT_BANDWIDTH =
  INT_LEN + // num indices
  INT_LEN; // num signatures

const INTRINSIC_SECP256K1_FX_TRANSFERABLE_INPUT_BANDWIDTH =
  LONG_LEN + // amount
  INTRINSIC_SECP256K1_FX_INPUT_BANDWIDTH;

const INTRINSIC_SECP256K1_FX_SIGNATURE_BANDWIDTH =
  INT_LEN + // Signature index
  SIGNATURE_LENGTH; // Signature

const INTRINSIC_POP_BANDWIDTH =
  PUBLIC_KEY_LENGTH + // Public key
  BLS_SIGNATURE_LENGTH; // Signature

export const INTRINSIC_INPUT_DB_READ = 1;
export const INTRINSIC_INPUT_DB_WRITE = 1;
export const INTRINSIC_OUTPUT_DB_WRITE = 1;

export const INTRINSIC_BASE_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    2 + // codec version
    INT_LEN + // typeID
    INT_LEN + // networkID
    ID_LEN + // blockchainID
    INT_LEN + // number of outputs
    INT_LEN + // number of inputs
    INT_LEN + // length of memo
    INT_LEN, // number of credentials
  [FeeDimensions.DBRead]: 0,
  [FeeDimensions.DBWrite]: 0,
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    ID_LEN + // Subnet ID
    SHORT_LEN + // Chain name length
    ID_LEN + // vmID
    INT_LEN + // num fIds
    INT_LEN + // genesis length
    INT_LEN + // subnetAuth typeID
    INT_LEN, // subnetAuthCredential typeID
  [FeeDimensions.DBRead]: 1,
  [FeeDimensions.DBWrite]: 1,
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] + INT_LEN, // owner typeID
  [FeeDimensions.DBRead]: 0,
  [FeeDimensions.DBWrite]: 1,
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES: Dimensions =
  {
    [FeeDimensions.Bandwidth]:
      INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
      INTRINSIC_VALIDATOR_BANDWIDTH + // Validator
      ID_LEN + // Subnet ID
      INT_LEN + // Signer typeID
      INT_LEN + // Num stake outs
      INT_LEN + // Validator rewards typeID
      INT_LEN + // Delegator rewards typeID
      INT_LEN, // Delegation shares
    [FeeDimensions.DBRead]: 1,
    [FeeDimensions.DBWrite]: 1,
    [FeeDimensions.Compute]: 0,
  };

export const INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES: Dimensions =
  {
    [FeeDimensions.Bandwidth]:
      INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
      INTRINSIC_VALIDATOR_BANDWIDTH + // Validator
      ID_LEN + // Subnet ID
      INT_LEN + // Num stake outs
      INT_LEN, // Delegator rewards typeID
    [FeeDimensions.DBRead]: 1,
    [FeeDimensions.DBWrite]: 1,
    [FeeDimensions.Compute]: 0,
  };

export const INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    INTRINSIC_SUBNET_VALIDATOR_BANDWIDTH + // Subnet Validator
    INT_LEN + // Subnet auth typeID
    INT_LEN, // Subnet auth credential typeID
  [FeeDimensions.DBRead]: 2,
  [FeeDimensions.DBWrite]: 1,
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_EXPORT_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    ID_LEN + // destination chain ID
    INT_LEN, // num exported outputs
  [FeeDimensions.DBRead]: 0,
  [FeeDimensions.DBWrite]: 0,
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_IMPORT_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    ID_LEN + // source chain ID
    INT_LEN, // num imported inputs
  [FeeDimensions.DBRead]: 0,
  [FeeDimensions.DBWrite]: 0,
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_REMOVE_SUBNET_VALIDATOR_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    SHORT_ID_LEN + // nodeID
    ID_LEN + // subnetID
    INT_LEN + // subnetAuth typeId
    INT_LEN, // subnetAuth credential typeId
  [FeeDimensions.DBRead]: 2,
  [FeeDimensions.DBWrite]: 1,
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    ID_LEN + // subnetID
    INT_LEN + // subnetAuth typeID
    INT_LEN + // owner typeID
    INT_LEN, // subnetAuth credential typeID
  [FeeDimensions.DBRead]: 1,
  [FeeDimensions.DBWrite]: 1,
  [FeeDimensions.Compute]: 0,
};

/**
 * Returns the complexity outputs add to a transaction.
 */
export const outputComplexity = (
  transferableOutputs: TransferableOutput[],
): Dimensions => {
  let complexity = getEmptyDimensions();

  for (const transferableOutput of transferableOutputs) {
    // outputComplexity logic
    const outComplexity: Dimensions = {
      [FeeDimensions.Bandwidth]:
        INTRINSIC_OUTPUT_BANDWIDTH + INTRINSIC_SECP256K1_FX_OUTPUT_BANDWIDTH,
      [FeeDimensions.DBRead]: 0,
      [FeeDimensions.DBWrite]: INTRINSIC_OUTPUT_DB_WRITE,
      [FeeDimensions.Compute]: 0,
    };

    let numberOfAddresses = 0;

    if (isStakeableLockOut(transferableOutput.output)) {
      outComplexity[FeeDimensions.Bandwidth] +=
        INTRINSIC_STAKEABLE_LOCKED_OUTPUT_BANDWIDTH;
      numberOfAddresses =
        transferableOutput.output.getOutputOwners().addrs.length;
    } else if (isTransferOut(transferableOutput.output)) {
      numberOfAddresses = transferableOutput.output.outputOwners.addrs.length;
    }

    const addressBandwidth = numberOfAddresses * SHORT_ID_LEN;

    outComplexity[FeeDimensions.Bandwidth] += addressBandwidth;

    // Finish with OutputComplexity logic
    complexity = addDimensions(complexity, outComplexity);
  }

  return complexity;
};

/**
 * Returns the complexity inputs add to a transaction.
 *
 * It includes the complexity that the corresponding credentials will add.
 */
export const inputComplexity = (
  transferableInputs: TransferableInput[],
): Dimensions => {
  let complexity = getEmptyDimensions();

  for (const transferableInput of transferableInputs) {
    const inputComplexity: Dimensions = {
      [FeeDimensions.Bandwidth]:
        INTRINSIC_INPUT_BANDWIDTH +
        INTRINSIC_SECP256K1_FX_TRANSFERABLE_INPUT_BANDWIDTH,
      [FeeDimensions.DBRead]: INTRINSIC_INPUT_DB_READ,
      [FeeDimensions.DBWrite]: INTRINSIC_INPUT_DB_WRITE,
      [FeeDimensions.Compute]: 0, // TODO: Add compute complexity.
    };

    if (isStakeableLockIn(transferableInput.input)) {
      inputComplexity[FeeDimensions.Bandwidth] +=
        INTRINSIC_STAKEABLE_LOCKED_INPUT_BANDWIDTH;
    }

    const numberOfSignatures = transferableInput.sigIndicies().length;

    const signatureBandwidth =
      numberOfSignatures * INTRINSIC_SECP256K1_FX_SIGNATURE_BANDWIDTH;

    inputComplexity[FeeDimensions.Bandwidth] += signatureBandwidth;

    // Finalize
    complexity = addDimensions(complexity, inputComplexity);
  }

  return complexity;
};

export const signerComplexity = (signer: Signer | SignerEmpty): Dimensions => {
  if (signer instanceof SignerEmpty) {
    return getEmptyDimensions();
  }

  return makeDimensions(
    INTRINSIC_POP_BANDWIDTH,
    0,
    0,
    0, // TODO: Add compute complexity.
  );
};

export const ownerComplexity = (outputOwners: OutputOwners): Dimensions => {
  const numberOfAddresses = outputOwners.addrs.length;
  const addressBandwidth = numberOfAddresses * SHORT_ID_LEN;

  const bandwidth =
    addressBandwidth + INTRINSIC_SECP256K1_FX_OUTPUT_OWNERS_BANDWIDTH;

  return makeDimensions(bandwidth, 0, 0, 0);
};

/**
 * Returns the complexity an authorization adds to a transaction.
 * It does not include the typeID of the authorization.
 * It does include the complexity that the corresponding credential will add.
 * It does not include the typeID of the credential.
 */
export const authComplexity = (input: Serializable): Dimensions => {
  // TODO: Not a fan of this. May be better to re-type `subnetAuth` as `Input` in `AddSubnetValidatorTx`?
  if (!(input instanceof Input)) {
    throw new Error(
      'Unable to calculate auth complexity of transaction. Expected Input as subnet auth.',
    );
  }

  const numberOfSignatures = input.values().length;

  const signatureBandwidth =
    numberOfSignatures * INTRINSIC_SECP256K1_FX_SIGNATURE_BANDWIDTH;

  const bandwidth = signatureBandwidth + INTRINSIC_SECP256K1_FX_INPUT_BANDWIDTH;

  return makeDimensions(
    bandwidth,
    0,
    0,
    0, // TODO: Add compute complexity.
  );
};

const baseTxComplexity = (baseTx: BaseTx): Dimensions => {
  const outputsComplexity = outputComplexity(baseTx.outputs);
  const inputsComplexity = inputComplexity(baseTx.inputs);

  const complexity = addDimensions(outputsComplexity, inputsComplexity);

  complexity[FeeDimensions.Bandwidth] += baseTx.memo.length;

  return complexity;
};

const addPermissionlessValidatorTx = (
  tx: AddPermissionlessValidatorTx,
): Dimensions => {
  return addDimensions(
    INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    signerComplexity(tx.signer),
    outputComplexity(tx.stake),
    ownerComplexity(tx.getValidatorRewardsOwner()),
    ownerComplexity(tx.getDelegatorRewardsOwner()),
  );
};

const addPermissionlessDelegatorTx = (
  tx: AddPermissionlessDelegatorTx,
): Dimensions => {
  return addDimensions(
    INTRINSIC_ADD_PERMISSIONLESS_DELEGATOR_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    ownerComplexity(tx.getDelegatorRewardsOwner()),
    outputComplexity(tx.stake),
  );
};

const addSubnetValidatorTx = (tx: AddSubnetValidatorTx): Dimensions => {
  return addDimensions(
    INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    authComplexity(tx.subnetAuth),
  );
};

const baseTx = (tx: PvmBaseTx): Dimensions => {
  return addDimensions(
    INTRINSIC_BASE_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
  );
};

const createChainTx = (tx: CreateChainTx): Dimensions => {
  let bandwidth: number = tx.fxIds.length * ID_LEN;
  bandwidth += tx.chainName.value().length;
  bandwidth += tx.genesisData.length;

  const dynamicComplexity = makeDimensions(bandwidth, 0, 0, 0);

  return addDimensions(
    INTRINSIC_CREATE_CHAIN_TX_COMPLEXITIES,
    dynamicComplexity,
    baseTxComplexity(tx.baseTx),
    authComplexity(tx.subnetAuth),
  );
};

const createSubnetTx = (tx: CreateSubnetTx): Dimensions => {
  return addDimensions(
    INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    ownerComplexity(tx.getSubnetOwners()),
  );
};

const exportTx = (tx: ExportTx): Dimensions => {
  return addDimensions(
    INTRINSIC_EXPORT_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    outputComplexity(tx.outs),
  );
};

const importTx = (tx: ImportTx): Dimensions => {
  return addDimensions(
    INTRINSIC_IMPORT_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    inputComplexity(tx.ins),
  );
};

const removeSubnetValidatorTx = (tx: RemoveSubnetValidatorTx): Dimensions => {
  return addDimensions(
    INTRINSIC_REMOVE_SUBNET_VALIDATOR_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    authComplexity(tx.subnetAuth),
  );
};

const transferSubnetOwnershipTx = (
  tx: TransferSubnetOwnershipTx,
): Dimensions => {
  return addDimensions(
    INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    authComplexity(tx.subnetAuth),
    ownerComplexity(tx.getSubnetOwners()),
  );
};

export const txComplexity = (tx: Transaction): Dimensions => {
  if (isAddPermissionlessValidatorTx(tx)) {
    return addPermissionlessValidatorTx(tx);
  } else if (isAddPermissionlessDelegatorTx(tx)) {
    return addPermissionlessDelegatorTx(tx);
  } else if (isAddSubnetValidatorTx(tx)) {
    return addSubnetValidatorTx(tx);
  } else if (isCreateChainTx(tx)) {
    return createChainTx(tx);
  } else if (isCreateSubnetTx(tx)) {
    return createSubnetTx(tx);
  } else if (isExportTx(tx)) {
    return exportTx(tx);
  } else if (isImportTx(tx)) {
    return importTx(tx);
  } else if (isRemoveSubnetValidatorTx(tx)) {
    return removeSubnetValidatorTx(tx);
  } else if (isTransferSubnetOwnershipTx(tx)) {
    return transferSubnetOwnershipTx(tx);
  } else if (isPvmBaseTx(tx)) {
    return baseTx(tx);
  } else {
    throw new Error('Unsupported transaction type.');
  }
};
