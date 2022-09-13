import type { Transaction } from '../../vms/common/transaction';
import type { Serializable } from '../common/types';
import type { CreateAssetTx } from './createAssetTx';
import { createAssetTx_symbol } from './createAssetTx';
import type { ExportTx } from './exportTx';
import { exportTx_symbol } from './exportTx';
import type { ImportTx } from './importTx';
import { importTx_symbol } from './importTx';
import type { OperationTx } from './operationTx';
import { operationTx_symbol } from './operationTx';

export function isExportTx(tx: Transaction): tx is ExportTx {
  return tx._type === exportTx_symbol;
}

export function isImportTx(tx: Serializable): tx is ImportTx {
  return tx._type === importTx_symbol;
}

export function isCreateAssetTx(tx: Serializable): tx is CreateAssetTx {
  return tx._type === createAssetTx_symbol;
}

export function isOperationTx(tx: Serializable): tx is OperationTx {
  return tx._type === operationTx_symbol;
}
