import type { Transaction } from '../../vms/common/transaction';
import type { ImportTx } from './importTx';
import { importTx_symbol } from './importTx';
import type { ExportTx } from './exportTx';
import { exportTx_symbol } from './exportTx';
import type { AddValidatorTx } from './addValidatorTx';
import { addValidatorTx_symbol } from './addValidatorTx';
import type { AddDelegatorTx } from './addDelegatorTx';
import { addDelegatorTx_symbol } from './addDelegatorTx';
import type { AddSubnetValidatorTx } from './addSubnetValidatorTx';
import { addSubnetValidatorTx_symbol } from './addSubnetValidatorTx';
import type { CreateChainTx } from './createChainTx';
import { createChainTx_symbol } from './createChainTx';
import type { CreateSubnetTx } from './createSubnetTx';
import { createSubnetTx_symbol } from './createSubnetTx';

export function isImportTx(tx: Transaction): tx is ImportTx {
  return tx._type === importTx_symbol;
}

export function isExportTx(tx: Transaction): tx is ExportTx {
  return tx._type === exportTx_symbol;
}

export function isAddValidatorTx(tx: Transaction): tx is AddValidatorTx {
  return tx._type === addValidatorTx_symbol;
}

export function isAddDelegatorTx(tx: Transaction): tx is AddDelegatorTx {
  return tx._type === addDelegatorTx_symbol;
}

export function isAddSubnetValidatorTx(
  tx: Transaction,
): tx is AddSubnetValidatorTx {
  return tx._type === addSubnetValidatorTx_symbol;
}

export function isCreateChainTx(tx: Transaction): tx is CreateChainTx {
  return tx._type === createChainTx_symbol;
}

export function isCreateSubnetTx(tx: Transaction): tx is CreateSubnetTx {
  return tx._type === createSubnetTx_symbol;
}
