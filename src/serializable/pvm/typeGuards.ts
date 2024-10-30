import type { Transaction } from '../../vms/common/transaction';
import type { BaseTx } from './baseTx';
import type { ImportTx } from './importTx';
import type { ExportTx } from './exportTx';
import type { AddValidatorTx } from './addValidatorTx';
import type { AddDelegatorTx } from './addDelegatorTx';
import type { AddSubnetValidatorTx } from './addSubnetValidatorTx';
import type { CreateChainTx } from './createChainTx';
import type { CreateSubnetTx } from './createSubnetTx';
import type { RemoveSubnetValidatorTx } from './removeSubnetValidatorTx';
import type { AddPermissionlessDelegatorTx } from './addPermissionlessDelegatorTx';
import type { AddPermissionlessValidatorTx } from './addPermissionlessValidatorTx';
import type { AdvanceTimeTx } from './advanceTimeTx';
import type { RewardValidatorTx } from './rewardValidatorTx';
import type { Signer, SignerEmpty } from './signer';
import type { TransferSubnetOwnershipTx } from './transferSubnetOwnershipTx';
import { TypeSymbols } from '../constants';
import type { TransformSubnetTx } from './transformSubnetTx';
import type { ConvertSubnetTx } from './convertSubnetTx';
import type { IncreaseBalanceTx } from './increaseBalanceTx';
import type { DisableSubnetValidatorTx } from './disableSubnetValidatorTx';
import type { SetSubnetValidatorWeightTx } from './setSubnetValidatorWeightTx';
import type { RegisterSubnetValidatorTx } from './registerSubnetValidatorTx';

export function isPvmBaseTx(tx: Transaction): tx is BaseTx {
  return tx._type === TypeSymbols.PvmBaseTx;
}

export function isAddDelegatorTx(tx: Transaction): tx is AddDelegatorTx {
  return tx._type === TypeSymbols.AddDelegatorTx;
}

export function isAddPermissionlessDelegatorTx(
  tx: Transaction,
): tx is AddPermissionlessDelegatorTx {
  return tx._type === TypeSymbols.AddPermissionlessDelegatorTx;
}

export function isAddPermissionlessValidatorTx(
  tx: Transaction,
): tx is AddPermissionlessValidatorTx {
  return tx._type === TypeSymbols.AddPermissionlessValidatorTx;
}

export function isAddSubnetValidatorTx(
  tx: Transaction,
): tx is AddSubnetValidatorTx {
  return tx._type === TypeSymbols.AddSubnetValidatorTx;
}

export function isAddValidatorTx(tx: Transaction): tx is AddValidatorTx {
  return tx._type === TypeSymbols.AddValidatorTx;
}

export function isAdvanceTimeTx(tx: Transaction): tx is AdvanceTimeTx {
  return tx._type === TypeSymbols.AdvanceTimeTx;
}

export function isCreateChainTx(tx: Transaction): tx is CreateChainTx {
  return tx._type === TypeSymbols.CreateChainTx;
}

export function isCreateSubnetTx(tx: Transaction): tx is CreateSubnetTx {
  return tx._type === TypeSymbols.CreateSubnetTx;
}

export function isRemoveSubnetValidatorTx(
  tx: Transaction,
): tx is RemoveSubnetValidatorTx {
  return tx._type === TypeSymbols.RemoveSubnetValidatorTx;
}

export function isTransferSubnetOwnershipTx(
  tx: Transaction,
): tx is TransferSubnetOwnershipTx {
  return tx._type === TypeSymbols.TransferSubnetOwnershipTx;
}

export function isTransformSubnetTx(tx: Transaction): tx is TransformSubnetTx {
  return tx._type === TypeSymbols.TransformSubnetTx;
}

export function isExportTx(tx: Transaction): tx is ExportTx {
  return tx._type === TypeSymbols.PvmExportTx;
}

export function isImportTx(tx: Transaction): tx is ImportTx {
  return tx._type === TypeSymbols.PvmImportTx;
}

export function isRewardValidatorTx(tx: Transaction): tx is RewardValidatorTx {
  return tx._type === TypeSymbols.RewardValidatorTx;
}

export function isConvertSubnetTx(tx: Transaction): tx is ConvertSubnetTx {
  return tx._type === TypeSymbols.ConvertSubnetTx;
}

export function isRegisterSubnetValidatorTx(
  tx: Transaction,
): tx is RegisterSubnetValidatorTx {
  return tx._type === TypeSymbols.RegisterSubnetValidatorTx;
}

export function isSetSubnetValidatorWeightTx(
  tx: Transaction,
): tx is SetSubnetValidatorWeightTx {
  return tx._type === TypeSymbols.SetSubnetValidatorWeightTx;
}

export function isIncreaseBalanceTx(tx: Transaction): tx is IncreaseBalanceTx {
  return tx._type === TypeSymbols.IncreaseBalanceTx;
}

export function isDisableSubnetValidatorTx(
  tx: Transaction,
): tx is DisableSubnetValidatorTx {
  return tx._type === TypeSymbols.DisableSubnetValidatorTx;
}

export function isEmptySigner(
  signer: Signer | SignerEmpty,
): signer is SignerEmpty {
  return signer._type === TypeSymbols.SignerEmpty;
}

export function isSigner(signer: Signer | SignerEmpty): signer is Signer {
  return signer._type === TypeSymbols.Signer;
}
