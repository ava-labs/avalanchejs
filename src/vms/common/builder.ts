import type { TransferableInput, TransferableOutput } from '../../serializable';
import type { Context } from '../context/model';
import { BaseTx as AvaxBaseTx } from '../../serializable/avax';

/**
 * format a BaseTx for xChain directly from inputs with no validation
 * @param changeOutputs - the output representing the remaining amounts from each input
 * @param inputs - the inputs of the tx
 * @param memo - optional memo
 */
export const baseTxUnsafeAvm = (
  context: Context,
  changeOutputs: TransferableOutput[],
  inputs: TransferableInput[],
  memo: Uint8Array,
) => {
  return AvaxBaseTx.fromNative(
    context.networkID,
    context.xBlockchainID,
    changeOutputs,
    inputs,
    memo,
  );
};

/**
 * format a BaseTx for pChain directly from inputs with no validation
 * @param changeOutputs - the output representing the remaining amounts from each input
 * @param inputs - the inputs of the tx
 * @param memo - optional memo
 */
export const baseTxUnsafePvm = (
  context: Context,
  changeOutputs: readonly TransferableOutput[],
  inputs: readonly TransferableInput[],
  memo: Uint8Array,
) => {
  return AvaxBaseTx.fromNative(
    context.networkID,
    context.pBlockchainID,
    changeOutputs,
    inputs,
    memo,
  );
};
