import type { TransferInput, TransferableInput } from 'serializable';

/**
 * @see https://github.com/ava-labs/avalanchego/blob/master/vms/secp256k1fx/input.go#L14
 */
export const COST_PER_SIGNATURE = 1000n;

export const getCost = (input: TransferInput | TransferableInput): bigint =>
  BigInt(input.sigIndicies().length) * COST_PER_SIGNATURE;
