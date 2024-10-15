import type { NodeId } from '../../../serializable/fxs/common/nodeId';
import { SHORT_ID_LEN } from '../../../serializable/fxs/common/nodeId';
import type { ConvertSubnetValidator } from '../../../serializable/fxs/pvm/convertSubnetValidator';
import { Signer } from '../../../serializable/pvm';
import { convertSubnetValidatorFromBytes } from '../../../utils/convertSubnetValidatorsFromBytes';
import {
  addDimensions,
  createDimensions,
  createEmptyDimensions,
  type Dimensions,
} from '../../common';
import { getSignerComplexity } from '../txs/fee';
import { INTRINSIC_CONVERT_SUBNET_VALIDATOR_COMPLEXITIES } from '../txs/fee/constants';

export const getMemoComplexity = (memo: Uint8Array): Dimensions => {
  return createDimensions({
    bandwidth: memo.length,
    dbRead: 0,
    dbWrite: 0,
    compute: 0,
  });
};

export const getAddressComplexity = (address: Uint8Array): Dimensions => {
  return createDimensions({
    bandwidth: address.length,
    dbRead: 0,
    dbWrite: 0,
    compute: 0,
  });
};

export const getNodeIdComplexity = (nodeId: NodeId): Dimensions => {
  return createDimensions({
    bandwidth: nodeId.toBytes().length,
    dbRead: 0,
    dbWrite: 0,
    compute: 0,
  });
};

export const getConvertSubnetValidatorsComplexity = (
  validatorBytes: readonly Uint8Array[],
): Dimensions => {
  let complexity = createEmptyDimensions();
  const validators = convertSubnetValidatorFromBytes(validatorBytes);

  for (const validator of validators) {
    complexity = addDimensions(
      complexity,
      getConvertSubnetValidatorComplexity(validator),
    );
  }
  return complexity;
};

export const getConvertSubnetValidatorComplexity = (
  validator: ConvertSubnetValidator,
): Dimensions => {
  const nodeIdComplexity = getNodeIdComplexity(validator.nodeId);
  const signerComplexity = getSignerComplexity(new Signer(validator.signer));
  const addressComplexity = createDimensions({
    bandwidth:
      (validator.remainingBalanceOwner.addresses.length +
        validator.deactivationOwner.addresses.length) *
      SHORT_ID_LEN,
    dbRead: 0,
    dbWrite: 0,
    compute: 0,
  });
  return addDimensions(
    INTRINSIC_CONVERT_SUBNET_VALIDATOR_COMPLEXITIES,
    nodeIdComplexity,
    signerComplexity,
    addressComplexity,
  );
};
