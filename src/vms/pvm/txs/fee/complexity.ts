import {
  PUBLIC_KEY_LENGTH,
  SIGNATURE_LENGTH as BLS_SIGNATURE_LENGTH,
} from '../../../../crypto/bls';
import { SIGNATURE_LENGTH } from '../../../../crypto/secp256k1';
import type { OutputOwners } from '../../../../serializable';
import { NodeId } from '../../../../serializable';
import { Input } from '../../../../serializable/fxs/secp256k1';
import type {
  BaseTx,
  TransferableInput,
  TransferableOutput,
} from '../../../../serializable/avax';
import type {
  AddPermissionlessValidatorTx,
  AddSubnetValidatorTx,
  Signer,
} from '../../../../serializable/pvm';
import { SignerEmpty } from '../../../../serializable/pvm';
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
  makeDimension,
} from '../../../common/fees/dimensions';
import type { Serializable } from '../../../common/types';

/**
 * Number of bytes per long.
 */
const LONG_LEN = 8;

const ID_LEN = 32;

const SHORT_ID_LEN = 20;

/**
 * Number of bytes per int.
 */
const INT_LEN = 4;

const INTRINSIC_VALIDATOR_BANDWIDTH =
  NodeId.length + // Node ID (Short ID = 20)
  LONG_LEN + // Start
  LONG_LEN + // End
  LONG_LEN; // Weight

const INTRINSIC_SUBNET_VALIDATOR_BANDWIDTH =
  INTRINSIC_VALIDATOR_BANDWIDTH + // Validator
  +ID_LEN; // Subnet ID (ID Length = 32)

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

const INTRINSIC_INPUT_DB_READ = 1;
const INTRINSIC_INPUT_DB_WRITE = 1;
const INTRINSIC_OUTPUT_DB_WRITE = 1;

const INTRINSIC_BASE_TX_COMPLEXITIES: Dimensions = {
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

const INTRINSIC_ADD_PERMISSIONLESS_VALIDATOR_TX_COMPLEXITIES: Dimensions = {
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

const INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    INTRINSIC_SUBNET_VALIDATOR_BANDWIDTH + // Subnet Validator
    INT_LEN + // Subnet auth typeID
    INT_LEN, // Subnet auth credential typeID
  [FeeDimensions.DBRead]: 2,
  [FeeDimensions.DBWrite]: 1,
  [FeeDimensions.Compute]: 0,
};

/**
 * Returns the complexity outputs add to a transaction.
 */
export const outputComplexity = (output: TransferableOutput[]): Dimensions => {
  let complexity = getEmptyDimensions();

  for (const out of output) {
    // outputComplexity logic
    const outComplexity: Dimensions = {
      [FeeDimensions.Bandwidth]:
        INTRINSIC_OUTPUT_BANDWIDTH + INTRINSIC_SECP256K1_FX_OUTPUT_BANDWIDTH,
      [FeeDimensions.DBRead]: 0,
      [FeeDimensions.DBWrite]: INTRINSIC_OUTPUT_DB_WRITE,
      [FeeDimensions.Compute]: 0,
    };

    let numberOfAddresses = 0;

    // TODO: Double check this if logic.
    if (isStakeableLockOut(out.output)) {
      outComplexity[FeeDimensions.Bandwidth] +=
        INTRINSIC_STAKEABLE_LOCKED_OUTPUT_BANDWIDTH;
      numberOfAddresses = out.output.getOutputOwners().addrs.length;
    } else if (isTransferOut(out.output)) {
      numberOfAddresses = out.output.outputOwners.addrs.length;
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
export const inputComplexity = (inputs: TransferableInput[]): Dimensions => {
  let complexity = getEmptyDimensions();

  for (const input of inputs) {
    const inputComplexity: Dimensions = {
      [FeeDimensions.Bandwidth]:
        INTRINSIC_INPUT_BANDWIDTH +
        INTRINSIC_SECP256K1_FX_TRANSFERABLE_INPUT_BANDWIDTH,
      [FeeDimensions.DBRead]: INTRINSIC_INPUT_DB_READ,
      [FeeDimensions.DBWrite]: INTRINSIC_INPUT_DB_WRITE,
      [FeeDimensions.Compute]: 0, // TODO: Add compute complexity.
    };

    // TODO: Double check this if logic.
    if (isStakeableLockIn(input.input)) {
      inputComplexity[FeeDimensions.Bandwidth] +=
        INTRINSIC_STAKEABLE_LOCKED_INPUT_BANDWIDTH;
    }

    const numberOfSignatures = input.sigIndicies().length;

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

  return makeDimension(
    INTRINSIC_POP_BANDWIDTH,
    0,
    0,
    0, // TODO: Add compute complexity.
  );
};

export const ownerComplexity = (owner: OutputOwners): Dimensions => {
  const numberOfAddresses = owner.addrs.length;
  const addressBandwidth = numberOfAddresses * SHORT_ID_LEN;

  const bandwidth =
    addressBandwidth + INTRINSIC_SECP256K1_FX_OUTPUT_OWNERS_BANDWIDTH;

  return makeDimension(bandwidth, 0, 0, 0);
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

  return makeDimension(
    bandwidth,
    0,
    0,
    0, // TODO: Add compute complexity.
  );
};

// See: vms/platformvm/txs/fee/complexity.go:583
const baseTxComplexity = (tx: BaseTx): Dimensions => {
  const outputsComplexity = outputComplexity(tx.outputs);
  const inputsComplexity = inputComplexity(tx.inputs);

  const complexity = addDimensions(outputsComplexity, inputsComplexity);

  // TODO: Verify if .toBytes().length is correct.
  // See: vms/platformvm/txs/fee/complexity.go:598
  complexity[FeeDimensions.Bandwidth] += tx.memo.toBytes().length;

  return getEmptyDimensions();
};

export const addPermissionlessValidatorTx = (
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

export const addSubnetValidatorTx = (tx: AddSubnetValidatorTx): Dimensions => {
  return addDimensions(
    INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES,
    baseTxComplexity(tx.baseTx),
    authComplexity(tx.subnetAuth),
  );
};
