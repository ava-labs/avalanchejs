import { isImportTx as isAvmImportTx } from '../serializable/avm';
import { isImportTx as isPvmImportTx } from '../serializable/pvm';
import {
  isExportTx as isEvmExportTx,
  isImportExportTx,
  isEvmTx,
} from '../serializable/evm';
import type { AvaxTx } from '../serializable/avax';
import type { EVMTx } from '../serializable/evm/abstractTx';

export const getTransferableInputsByEvmTx = (tx: EVMTx) => {
  if (isImportExportTx(tx)) {
    return isEvmExportTx(tx) ? [] : tx.importedInputs;
  }

  // Unreachable
  return [];
};

export const getTransferableInputsByTx = (tx: AvaxTx | EVMTx) => {
  if (isEvmTx(tx)) {
    return getTransferableInputsByEvmTx(tx);
  }
  if (isAvmImportTx(tx) || isPvmImportTx(tx)) {
    return [...(tx.baseTx.inputs ?? []), ...(tx.ins ?? [])];
  }

  return tx.getInputs();
};
