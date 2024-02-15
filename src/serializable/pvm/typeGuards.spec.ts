import { TypeSymbols } from '../constants';
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
