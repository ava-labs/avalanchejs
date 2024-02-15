import type { AvaxTx, TransferableInput } from '../serializable/avax';
import { isTransferableInput } from '../serializable/avax';
import type { Input, Output } from '../serializable/evm';
import {
  isExportTx as isEvmExportTx,
  isImportTx as isEvmImportTx,
} from '../serializable/evm';
import type { TransferableOutput } from '../serializable/avax';
import { isTransferableOutput } from '../serializable/avax';
import { getTransferableInputsByTx } from './getTransferableInputsByTx';
import { getTransferableOutputsByTx } from './getTransferableOutputsByTx';
import type { EVMTx } from '../serializable/evm/abstractTx';

const _reducer = (
  assetAmountMap: Map<string, bigint>,
  item: Input | TransferableInput | Output | TransferableOutput,
) => {
  const previousAmount = assetAmountMap.get(item.assetId.toString()) ?? 0n;
  const amount =
    isTransferableInput(item) || isTransferableOutput(item)
      ? item.amount()
      : item.amount.value();

  assetAmountMap.set(item.assetId.toString(), previousAmount + amount);

  return assetAmountMap;
};

export const getInputAmounts = (tx: AvaxTx | EVMTx) => {
  /**
   * `getTransferableInputsByTx` only returns `TransferableInputs`
   * so we have to collect the EVM Inputs in an extra step
   * */
  if (isEvmExportTx(tx)) {
    return tx.ins.reduce(_reducer, new Map<string, bigint>());
  }
  const inputs = getTransferableInputsByTx(tx);
  return inputs.reduce(_reducer, new Map<string, bigint>());
};

export const getOutputAmounts = (tx: AvaxTx | EVMTx) => {
  /**
   * `getTransferableOutputsByTx` only returns `TransferableOutputs`
   * so we have to collect the EVM Outs in an extra step
   * */
  if (isEvmImportTx(tx)) {
    return tx.Outs.reduce(_reducer, new Map<string, bigint>());
  }
  const outputs = getTransferableOutputsByTx(tx);
  return outputs.reduce((assetAmountMap, output) => {
    if (isTransferableOutput(output)) {
      return _reducer(assetAmountMap, output);
    }

    return assetAmountMap;
  }, new Map<string, bigint>());
};

export const getBurnedAmountByTx = (tx: AvaxTx | EVMTx) => {
  const inputAmounts = getInputAmounts(tx);
  const outputAmounts = getOutputAmounts(tx);
  const burnedAmounts = new Map<string, bigint>();

  for (const [id, inputAmount] of inputAmounts.entries()) {
    const outputAmount = outputAmounts.get(id) ?? 0n;
    burnedAmounts.set(id, inputAmount - outputAmount);
  }

  return burnedAmounts;
};
