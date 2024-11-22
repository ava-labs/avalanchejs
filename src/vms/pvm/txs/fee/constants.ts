/**
 * The INTRINSIC constants are based on the following constants from the AvalancheGo codebase:
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/txs/fee/complexity.go
 */
import type { Dimensions } from '../../../common/fees/dimensions';
import { FeeDimensions } from '../../../common/fees/dimensions';
import {
  PUBLIC_KEY_LENGTH,
  SIGNATURE_LENGTH as BLS_SIGNATURE_LENGTH,
} from '../../../../crypto/bls';
import { SIGNATURE_LENGTH } from '../../../../crypto/secp256k1';
import { INT_LEN } from '../../../../serializable/primitives/int';
import { SHORT_LEN } from '../../../../serializable/primitives/short';
import { SHORT_ID_LEN } from '../../../../serializable/fxs/common/nodeId';
import { ID_LEN } from '../../../../serializable/fxs/common/id';

/**
 * Number of bytes per long.
 */
const LONG_LEN = 8;

const INTRINSIC_VALIDATOR_BANDWIDTH =
  SHORT_ID_LEN + // Node ID (Short ID = 20)
  LONG_LEN + // Start
  LONG_LEN + // End
  LONG_LEN; // Weight

const INTRINSIC_SUBNET_VALIDATOR_BANDWIDTH =
  INTRINSIC_VALIDATOR_BANDWIDTH + // Validator
  ID_LEN; // Subnet ID (ID Length = 32)

export const INTRINSIC_OUTPUT_BANDWIDTH =
  ID_LEN + // assetID
  INT_LEN; // output typeID

export const INTRINSIC_STAKEABLE_LOCKED_OUTPUT_BANDWIDTH =
  LONG_LEN + // locktime
  INT_LEN; // output typeID

export const INTRINSIC_SECP256K1_FX_OUTPUT_OWNERS_BANDWIDTH =
  LONG_LEN + // locktime
  INT_LEN + // threshold
  INT_LEN; // number of addresses

export const INTRINSIC_SECP256K1_FX_OUTPUT_BANDWIDTH =
  LONG_LEN + // amount
  INTRINSIC_SECP256K1_FX_OUTPUT_OWNERS_BANDWIDTH;

export const INTRINSIC_INPUT_BANDWIDTH =
  ID_LEN + // txID
  INT_LEN + // output index
  ID_LEN + // assetID
  INT_LEN + // input typeID
  INT_LEN; // credential typeID

export const INTRINSIC_STAKEABLE_LOCKED_INPUT_BANDWIDTH =
  LONG_LEN + // locktime
  INT_LEN; // input typeID

export const INTRINSIC_SECP256K1_FX_INPUT_BANDWIDTH =
  INT_LEN + // num indices
  INT_LEN; // num signatures

export const INTRINSIC_SECP256K1_FX_TRANSFERABLE_INPUT_BANDWIDTH =
  LONG_LEN + // amount
  INTRINSIC_SECP256K1_FX_INPUT_BANDWIDTH;

export const INTRINSIC_SECP256K1_FX_SIGNATURE_BANDWIDTH =
  INT_LEN + // Signature index
  SIGNATURE_LENGTH; // Signature

export const INTRINSIC_SECP256K1_FX_SIGNATURE_COMPUTE = 200; // secp256k1 signature verification time is around 200us

export const INTRINSIC_BLS_AGGREGATE_COMPUTE = 5; // BLS public key aggregation time is around 5 us
export const INTRINSIC_BLS_VERIFY_COMPUTE = 1_000; // BLS verification time is around 1000us
export const INTRINSIC_BLS_PUBLIC_KEY_VALIDATION_COMPUTE = 50; // BLS public key validation time is around 50us
export const INTRINSIC_BLS_POP_VERIFY_COMPUTE =
  INTRINSIC_BLS_PUBLIC_KEY_VALIDATION_COMPUTE + INTRINSIC_BLS_VERIFY_COMPUTE;

export const INTRINSIC_WARP_DB_READS = 3 + 20; // chainID -> subnetID mapping + apply weight diffs + apply pk diffs + diff application reads

export const INTRINSIC_POP_BANDWIDTH =
  PUBLIC_KEY_LENGTH + // Public key
  BLS_SIGNATURE_LENGTH; // Signature

export const INTRINSIC_INPUT_DB_READ = 1;
export const INTRINSIC_INPUT_DB_WRITE = 1;
export const INTRINSIC_OUTPUT_DB_WRITE = 1;

export const INTRINSIC_BASE_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    SHORT_LEN + // codec version
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
  [FeeDimensions.DBRead]: 3, // get subnet auth + check for subnet transformation + check for subnet conversion
  [FeeDimensions.DBWrite]: 1, // put chain
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_CREATE_SUBNET_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] + INT_LEN, // owner typeID
  [FeeDimensions.DBRead]: 0,
  [FeeDimensions.DBWrite]: 1, // write subnet owner
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
    [FeeDimensions.DBRead]: 1, // get staking config
    [FeeDimensions.DBWrite]: 3, // put current staker + write weight diff + write pk diff
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
    [FeeDimensions.DBRead]: 1, // get staking config
    [FeeDimensions.DBWrite]: 2, // put current staker + write weight diff
    [FeeDimensions.Compute]: 0,
  };

export const INTRINSIC_ADD_SUBNET_VALIDATOR_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    INTRINSIC_SUBNET_VALIDATOR_BANDWIDTH + // Subnet Validator
    INT_LEN + // Subnet auth typeID
    INT_LEN, // Subnet auth credential typeID
  [FeeDimensions.DBRead]: 3, // get subnet auth + check for subnet transformation + check for subnet conversion
  [FeeDimensions.DBWrite]: 3, // put current staker + write weight diff + write pk diff
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
  [FeeDimensions.DBRead]: 1, // read subnet auth
  [FeeDimensions.DBWrite]: 3, // delete validator + write weight diff + write pk diff
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_TRANSFER_SUBNET_OWNERSHIP_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    ID_LEN + // subnetID
    INT_LEN + // subnetAuth typeID
    INT_LEN + // owner typeID
    INT_LEN, // subnetAuth credential typeID
  [FeeDimensions.DBRead]: 1, // read subnet auth
  [FeeDimensions.DBWrite]: 1, // set subnet owner
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_L1_VALIDATOR_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INT_LEN + // nodeID
    LONG_LEN + // weight
    LONG_LEN + // balance
    INT_LEN + // remaining balance owner threshold
    INT_LEN + // remaining balance owner num addresses
    INT_LEN + // deactivation owner threshold
    INT_LEN, // deactivation owner num addresses
  [FeeDimensions.DBRead]: 0,
  [FeeDimensions.DBWrite]: 4, // weight diff + pub key diff + subnetID/nodeID + validationID
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_CONVERT_SUBNET_TO_L1_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    ID_LEN + // subnetID
    ID_LEN + // chainID
    INT_LEN + // address length
    INT_LEN + // validators length
    INT_LEN + // subnetAuth typeID
    INT_LEN, // subnetAuthCredential typeID
  [FeeDimensions.DBRead]: 3, // subnet auth + transformation lookup + conversion lookup
  [FeeDimensions.DBWrite]: 2, // write conversion manager + total weight
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_REGISTER_L1_VALIDATOR_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    LONG_LEN + // balance
    BLS_SIGNATURE_LENGTH + // proof of possession
    INT_LEN, // message length
  [FeeDimensions.DBRead]: 5, // conversion owner + expiry lookup + sov lookup + subnetID/nodeID lookup + weight lookup
  [FeeDimensions.DBWrite]: 6, // write current staker + expiry + write weight diff + write pk diff + subnetID/nodeID lookup + weight lookup
  [FeeDimensions.Compute]: INTRINSIC_BLS_POP_VERIFY_COMPUTE,
};

export const INTRINSIC_SET_L1_VALIDATOR_WEIGHT_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] + INT_LEN, // message length
  [FeeDimensions.DBRead]: 3, // read staker + read conversion + read weight
  [FeeDimensions.DBWrite]: 5, // remaining balance utxo + write weight diff + write pk diff + weights lookup + validator write
  [FeeDimensions.Compute]: 0,
};

export const INTRINSIC_INCREASE_L1_VALIDATOR_BALANCE_TX_COMPLEXITIES: Dimensions =
  {
    [FeeDimensions.Bandwidth]:
      INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
      ID_LEN + // validationId
      LONG_LEN, // balance
    [FeeDimensions.DBRead]: 1, // read staker
    [FeeDimensions.DBWrite]: 5, // weight diff + deactivated weight diff + public key diff + delete staker + write staker
    [FeeDimensions.Compute]: 0,
  };

export const INTRINSIC_DISABLE_L1_VALIDATOR_TX_COMPLEXITIES: Dimensions = {
  [FeeDimensions.Bandwidth]:
    INTRINSIC_BASE_TX_COMPLEXITIES[FeeDimensions.Bandwidth] +
    ID_LEN + // validationId
    INT_LEN + // auth typeId
    INT_LEN, // auth credential typeId
  [FeeDimensions.DBRead]: 1, // read staker
  [FeeDimensions.DBWrite]: 6, // write remaining balance utxo + weight diff + deactivated weight diff + public key diff + delete staker + write staker
  [FeeDimensions.Compute]: 0,
};
