import {
  isImportTx,
  isExportTx,
  isImportExportTx,
  isEvmTx,
} from './typeGuards';
import { describe, it, expect } from 'vitest';

import { TypeSymbols } from '../constants';
import type { Transaction } from '../../vms/common';
import { onlyChecksOneGuard } from '../../fixtures/utils/typeguards';

const guards = [isImportTx, isExportTx];

describe('evm/typeGuards', function () {
  it('isImportTx', () => {
    const tx = {
      _type: TypeSymbols.EvmImportTx,
    } as Transaction;
    expect(isImportTx(tx)).toBe(true);
    expect(isImportExportTx(tx)).toBe(true);
    expect(isEvmTx(tx)).toBe(true);
    expect(onlyChecksOneGuard(tx, guards)).toBe(true);
  });

  it('isExportTx', () => {
    const tx = {
      _type: TypeSymbols.EvmExportTx,
    } as Transaction;
    expect(isExportTx(tx)).toBe(true);
    expect(isImportExportTx(tx)).toBe(true);
    expect(isEvmTx(tx)).toBe(true);
    expect(onlyChecksOneGuard(tx, guards)).toBe(true);
  });
});
