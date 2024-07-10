import type {
  TransferableInput,
  TransferableOutput,
} from '../../../serializable';
import { Credential, avaxSerial } from '../../../serializable';
import type { AvaxTx } from '../../../serializable/avax';
import type { Codec } from '../../../serializable/codec';
import {
  isAddSubnetValidatorTx,
  isRemoveSubnetValidatorTx,
} from '../../../serializable/pvm';
import { emptySignature } from '../../../constants/zeroValue';
import {
  getTransferableInputsByTx,
  getTransferableOutputsByTx,
} from '../../../utils';

import {
  FeeDimensions,
  addDimensions,
  emptyDimensions,
  type Dimensions,
} from './dimensions';
import { getCost } from './cost';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/platformvm/txs/fee/dynamic_calculator.go#L19
 */
const STAKER_LOOKUP_COST = 1000n; // equal to secp256k1fx.CostPerSignature;

/**
 * Codec.VersionSize -> wrappers.ShortLen -> 2
 * @see https://github.com/ava-labs/avalanchego/blob/master/codec/manager.go#L16
 */
const CODEC_VERSION_SIZE = 2n;
const WRAPPERS_INT_LEN = 4n;

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/components/fee/helpers.go#L17
 * @param codec
 * @param input
 * @returns
 */
export const meterInput = (
  codec: Codec,
  input: TransferableInput,
): Dimensions => {
  const size = BigInt(input.toBytes(codec).length) + CODEC_VERSION_SIZE;

  return {
    [FeeDimensions.Bandwidth]: size - CODEC_VERSION_SIZE,
    [FeeDimensions.Compute]: getCost(input),
    [FeeDimensions.DBRead]: size,
    [FeeDimensions.DBWrite]: size,
  };
};

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/components/fee/helpers.go#L37
 * @param codec
 * @param output
 * @returns
 */
export const meterOutput = (
  codec: Codec,
  output: TransferableOutput,
): Dimensions => {
  const size = BigInt(output.toBytes(codec).length) + CODEC_VERSION_SIZE;

  return {
    ...emptyDimensions(),
    [FeeDimensions.Bandwidth]: size - CODEC_VERSION_SIZE,
    [FeeDimensions.DBWrite]: size,
  };
};

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/components/fee/helpers.go#L50
 * @param codec
 * @param signatureCount
 * @returns
 */
export const meterCredential = (
  codec: Codec,
  signatureCount: number,
): Dimensions => {
  const signatures = new Array(signatureCount).fill(emptySignature);
  const credential = new Credential(signatures);
  const size = BigInt(credential.toBytes(codec).length) + CODEC_VERSION_SIZE;

  return {
    ...emptyDimensions(),
    [FeeDimensions.Bandwidth]: size - WRAPPERS_INT_LEN - CODEC_VERSION_SIZE,
  };
};

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/platformvm/txs/fee/dynamic_calculator.go#L195
 * @param codec
 * @param tx
 * @returns
 */
export const meterTx = (codec: Codec, tx: AvaxTx): Dimensions => {
  let dimensions = emptyDimensions();
  const size = BigInt(tx.toBytes(codec).length) + CODEC_VERSION_SIZE;
  console.log({ size });
  dimensions[FeeDimensions.Bandwidth] = size;

  // Credentials
  console.log({ tx, sigIndices: tx.getSigIndices() });
  for (const credential of tx.getSigIndices()) {
    const credentialDimensions = meterCredential(codec, credential.length);
    console.log({ credential, credentialDimensions });
    dimensions = addDimensions(dimensions, credentialDimensions);
  }
  dimensions[FeeDimensions.Bandwidth] += WRAPPERS_INT_LEN + CODEC_VERSION_SIZE;

  // Inputs
  const inputs = getTransferableInputsByTx(tx);
  for (const input of inputs) {
    const inputDimensions = meterInput(codec, input);
    inputDimensions[FeeDimensions.Bandwidth] = 0n; // inputs bandwidth is already accounted for above, so we zero it
    dimensions = addDimensions(dimensions, inputDimensions);
  }

  // Outputs
  const outputs = getTransferableOutputsByTx(tx);
  for (const output of outputs.filter(avaxSerial.isTransferableOutput)) {
    const outputDimensions = meterOutput(codec, output);
    outputDimensions[FeeDimensions.Bandwidth] = 0n; // output bandwidth is already accounted for above, so we zero it
    dimensions = addDimensions(dimensions, outputDimensions);
  }

  // Specific costs per Tx type
  const txSpecific = getTxSpecificComplexity(tx);

  return addDimensions(dimensions, txSpecific);
};

/**
 * @see https://github.com/ava-labs/avalanchego/blob/13a3f103fd12df1e89a60c0c922b38e17872c6f6/vms/platformvm/txs/fee/dynamic_calculator.go#L50
 * @param tx
 * @returns
 */
export const getTxSpecificComplexity = (tx: AvaxTx): Dimensions => {
  if (isAddSubnetValidatorTx(tx) || isRemoveSubnetValidatorTx(tx)) {
    return {
      ...emptyDimensions(),
      [FeeDimensions.Compute]: STAKER_LOOKUP_COST,
    };
  }
  return emptyDimensions();
};
