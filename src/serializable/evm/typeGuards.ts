import type { Transaction } from '../../vms/common/transaction';
import type { ExportTx } from './exportTx';
import { exportTx_symbol } from './exportTx';
import type { ImportTx } from './importTx';
import { importTx_symbol } from './importTx';

export function isExportTx(tx: Transaction): tx is ExportTx {
  return tx._type == exportTx_symbol;
}

export function isImportTx(tx: Transaction): tx is ImportTx {
  return tx._type == importTx_symbol;
}
