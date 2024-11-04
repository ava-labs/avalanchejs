import {
  avmBaseTx,
  importTx as avmImportTx,
  transferableInputs,
} from '../fixtures/avax';
import { describe, it, expect } from 'vitest';

import { importTx as pvmImportTx } from '../fixtures/pvm';
import {
  importTx as evmImportTx,
  exportTx as evmExportTx,
} from '../fixtures/evm';
import { getTransferableInputsByTx } from './getTransferableInputsByTx';

describe('getTransferableInputsByTx', () => {
  it('returns the inputs of a PVM import tx correctly', () => {
    expect(getTransferableInputsByTx(pvmImportTx())).toStrictEqual([
      ...transferableInputs(),
      ...transferableInputs(),
    ]);
  });

  it('returns the inputs of an AVM import tx correctly', () => {
    expect(getTransferableInputsByTx(avmImportTx())).toStrictEqual([
      ...transferableInputs(),
      ...transferableInputs(),
    ]);
  });

  it('returns the inputs of an EVM import tx correctly', () => {
    expect(getTransferableInputsByTx(evmImportTx())).toStrictEqual(
      transferableInputs(),
    );
  });

  it('returns the inputs of an EVM export tx correctly', () => {
    expect(getTransferableInputsByTx(evmExportTx())).toStrictEqual([]);
  });

  it('returns the inputs of a non-import tx correctly', () => {
    expect(getTransferableInputsByTx(avmBaseTx())).toStrictEqual(
      transferableInputs(),
    );
  });
});
