import type { Serializable } from '../common/types';
import type { BaseTx } from './baseTx';
import type { CreateAssetTx } from './createAssetTx';
import type { ExportTx } from './exportTx';
import type { ImportTx } from './importTx';
import type { OperationTx } from './operationTx';
import { TypeSymbols } from '../constants';

export function isAvmBaseTx(tx: Serializable): tx is BaseTx {
  return tx._type === TypeSymbols.AvmBaseTx;
}

export function isExportTx(tx: Serializable): tx is ExportTx {
  return tx._type === TypeSymbols.AvmExportTx;
}

export function isImportTx(tx: Serializable): tx is ImportTx {
  return tx._type === TypeSymbols.AvmImportTx;
}

export function isCreateAssetTx(tx: Serializable): tx is CreateAssetTx {
  return tx._type === TypeSymbols.CreateAssetTx;
}

export function isOperationTx(tx: Serializable): tx is OperationTx {
  return tx._type === TypeSymbols.OperationTx;
}
