import type { TransferableInput, TransferableOutput } from 'serializable';
import type { Dimensions } from './dimensions';
import { FeeDimensions, emptyDimensions } from './dimensions';
import { getCost } from './cost';
import type { Codec } from 'serializable/codec';
import { Credential } from 'serializable';
import { emptySignature } from 'constants/zeroValue';

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
  const size = BigInt(input.toBytes(codec).length);

  return {
    // https://github.com/ava-labs/avalanchego/blob/master/codec/manager.go#L16
    // Subtracting 2 because Codec.VersionSize -> wrappers.ShortLen -> 2
    [FeeDimensions.Bandwidth]: size - 2n,
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
  const size = BigInt(output.toBytes(codec).length);

  return {
    ...emptyDimensions(),
    // https://github.com/ava-labs/avalanchego/blob/master/codec/manager.go#L16
    // Subtracting 2 because Codec.VersionSize -> wrappers.ShortLen -> 2
    [FeeDimensions.Bandwidth]: size - 2n,
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
  const credential = new Credential(
    new Array(signatureCount).map(() => emptySignature),
  );
  const size = BigInt(credential.toBytes(codec).length);

  return {
    ...emptyDimensions(),
    // https://github.com/ava-labs/avalanchego/blob/master/codec/manager.go#L16
    // Subtracting 4 because wrappers.IntLen -> 4
    // Subtracting 2 because Codec.VersionSize -> wrappers.ShortLen -> 2
    [FeeDimensions.Bandwidth]: size - 4n - 2n,
  };
};
