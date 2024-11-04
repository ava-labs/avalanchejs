import {
  isAvmBaseTx,
  isExportTx,
  isImportTx,
  isOperationTx,
  isCreateAssetTx,
} from './typeGuards';
import { describe, it, expect } from 'vitest';

import { TypeSymbols } from '../constants';
import type { Serializable } from '../common/types';
import { onlyChecksOneGuard } from '../../fixtures/utils/typeguards';

const typeGuards = [
  isAvmBaseTx,
  isExportTx,
  isImportTx,
  isOperationTx,
  isCreateAssetTx,
];

describe('avm/typeGuards', function () {
  it('can check base tx', () => {
    const tx = { _type: TypeSymbols.AvmBaseTx } as Serializable;
    const check = isAvmBaseTx(tx);
    expect(check).toBe(true);
    expect(onlyChecksOneGuard(tx, typeGuards)).toBe(true);
  });

  it('can check export tx', () => {
    const tx = {
      _type: TypeSymbols.AvmExportTx,
    } as Serializable;
    const check = isExportTx(tx);
    expect(check).toBe(true);
    expect(onlyChecksOneGuard(tx, typeGuards)).toBe(true);
  });

  it('can check import tx', () => {
    const tx = {
      _type: TypeSymbols.AvmImportTx,
    } as Serializable;
    const check = isImportTx(tx);
    expect(check).toBe(true);
    expect(onlyChecksOneGuard(tx, typeGuards)).toBe(true);
  });

  it('can check operation tx', () => {
    const tx = {
      _type: TypeSymbols.OperationTx,
    } as Serializable;
    const check = isOperationTx(tx);
    expect(check).toBe(true);
    expect(onlyChecksOneGuard(tx, typeGuards)).toBe(true);
  });

  it('can check create asset tx', () => {
    const tx = {
      _type: TypeSymbols.CreateAssetTx,
    } as Serializable;
    const check = isCreateAssetTx(tx);
    expect(check).toBe(true);
    expect(onlyChecksOneGuard(tx, typeGuards)).toBe(true);
  });
});
