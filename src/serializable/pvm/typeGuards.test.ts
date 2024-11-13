import { TypeSymbols } from '../constants';
import { describe, test, expect } from 'vitest';

import { onlyChecksOneGuard } from '../../fixtures/utils/typeguards';
import {
  isImportTx,
  isExportTx,
  isAddSubnetValidatorTx,
  isAddPermissionlessValidatorTx,
  isAddValidatorTx,
  isAddDelegatorTx,
  isAddPermissionlessDelegatorTx,
  isCreateSubnetTx,
  isCreateChainTx,
  isAdvanceTimeTx,
  isEmptySigner,
  isSigner,
  isRewardValidatorTx,
  isRemoveSubnetValidatorTx,
  isPvmBaseTx,
  isTransferSubnetOwnershipTx,
  isTransformSubnetTx,
  isConvertSubnetToL1Tx,
  isIncreaseL1ValidatorBalanceTx,
  isDisableL1ValidatorTx,
  isSetL1ValidatorWeightTx,
  isRegisterL1ValidatorTx,
} from './typeGuards';

const cases: [any, TypeSymbols][] = [
  [isPvmBaseTx, TypeSymbols.PvmBaseTx],
  [isImportTx, TypeSymbols.PvmImportTx],
  [isExportTx, TypeSymbols.PvmExportTx],
  [isAddSubnetValidatorTx, TypeSymbols.AddSubnetValidatorTx],
  [isAddPermissionlessValidatorTx, TypeSymbols.AddPermissionlessValidatorTx],
  [isAddValidatorTx, TypeSymbols.AddValidatorTx],
  [isAddDelegatorTx, TypeSymbols.AddDelegatorTx],
  [isAddPermissionlessDelegatorTx, TypeSymbols.AddPermissionlessDelegatorTx],
  [isCreateSubnetTx, TypeSymbols.CreateSubnetTx],
  [isRemoveSubnetValidatorTx, TypeSymbols.RemoveSubnetValidatorTx],
  [isCreateChainTx, TypeSymbols.CreateChainTx],
  [isAdvanceTimeTx, TypeSymbols.AdvanceTimeTx],
  [isEmptySigner, TypeSymbols.SignerEmpty],
  [isSigner, TypeSymbols.Signer],
  [isRewardValidatorTx, TypeSymbols.RewardValidatorTx],
  [isTransferSubnetOwnershipTx, TypeSymbols.TransferSubnetOwnershipTx],
  [isTransformSubnetTx, TypeSymbols.TransformSubnetTx],
  [isConvertSubnetToL1Tx, TypeSymbols.ConvertSubnetToL1Tx],
  [isRegisterL1ValidatorTx, TypeSymbols.RegisterL1ValidatorTx],
  [isSetL1ValidatorWeightTx, TypeSymbols.SetL1ValidatorWeightTx],
  [isIncreaseL1ValidatorBalanceTx, TypeSymbols.IncreaseL1ValidatorBalanceTx],
  [isDisableL1ValidatorTx, TypeSymbols.DisableL1ValidatorTx],
];

const guards = cases.map((caseItem) => caseItem[0]);

describe('pvm/typeGuards', function () {
  test.each(cases)('%p to pass', (guard, type) => {
    const object = {
      _type: type,
    };
    expect(guard(object)).toBe(true);
    expect(onlyChecksOneGuard(object, guards)).toBe(true);
  });
});
