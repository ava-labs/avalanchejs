import type { Transaction } from '../../vms/common/transaction';
import type { EVMTx } from './abstractTx';
import type { ExportTx } from './exportTx';
import type { ImportTx } from './importTx';
import { TypeSymbols } from '../constants';

export function isExportTx(tx: Transaction): tx is ExportTx {
  return tx._type == TypeSymbols.EvmExportTx;
}

export function isImportTx(tx: Transaction): tx is ImportTx {
  return tx._type == TypeSymbols.EvmImportTx;
}

export function isEvmTx(tx: Transaction): tx is EVMTx {
  return isImportTx(tx) || isExportTx(tx);
}

export function isImportExportTx(tx: Transaction): tx is ImportTx | ExportTx {
  if (!(isExportTx(tx) || isImportTx(tx))) {
    return false;
  }
  return true;
}
