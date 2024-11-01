import {
  exportTx as evmExportTx,
  importTx as evmImportTx,
} from '../fixtures/evm';
import { describe, it, expect } from 'vitest';

import { getTransferableOutputsByTx } from './getTransferableOutputsByTx';
import {
  avmBaseTx,
  exportTx as avmExportTx,
  importTx as avmImportTx,
  pvmBaseTx,
  transferableOutputs,
} from '../fixtures/avax';
import {
  addDelegatorTx,
  addPermissionlessDelegatorTx,
  addPermissionlessValidatorTx,
  addValidatorTx,
  importTx as pvmImportTx,
  exportTx as pvmExportTx,
  createSubnetTx,
  addSubnetValidatorTx,
  removeValidatorTx,
  transferSubnetOwnershipTx,
  transformSubnetTx,
} from '../fixtures/pvm';
import { outputOwner } from '../fixtures/secp256k1';

describe('getTransferableOutputsByTx', () => {
  const testData = [
    // EVM
    { tx: evmImportTx(), outs: [] },
    { tx: evmExportTx(), outs: transferableOutputs() },
    // AVM
    {
      tx: avmBaseTx(),
      outs: transferableOutputs(),
    },
    {
      tx: avmImportTx(),
      outs: transferableOutputs(),
    },
    {
      tx: avmExportTx(),
      outs: [...transferableOutputs(), ...transferableOutputs()],
    },
    // PVM
    {
      tx: pvmBaseTx(),
      outs: transferableOutputs(),
    },
    {
      tx: pvmImportTx(),
      outs: transferableOutputs(),
    },
    {
      tx: pvmExportTx(),
      outs: [...transferableOutputs(), ...transferableOutputs()],
    },
    {
      tx: addValidatorTx(),
      outs: [
        ...transferableOutputs(),
        ...transferableOutputs(),
        outputOwner(),
        outputOwner(),
      ],
    },
    {
      tx: addDelegatorTx(),
      outs: [...transferableOutputs(), ...transferableOutputs(), outputOwner()],
    },
    {
      tx: addPermissionlessValidatorTx(),
      outs: [
        ...transferableOutputs(),
        ...transferableOutputs(),
        outputOwner(),
        outputOwner(),
      ],
    },
    {
      tx: addPermissionlessDelegatorTx(),
      outs: [...transferableOutputs(), ...transferableOutputs(), outputOwner()],
    },
    {
      tx: createSubnetTx(),
      outs: [...transferableOutputs(), outputOwner()],
    },
    {
      tx: addSubnetValidatorTx(),
      outs: transferableOutputs(),
    },
    {
      tx: removeValidatorTx(),
      outs: transferableOutputs(),
    },
    {
      tx: transferSubnetOwnershipTx(),
      outs: transferableOutputs(),
    },
    {
      tx: transformSubnetTx(),
      outs: transferableOutputs(),
    },
  ];

  it.each(testData)(
    'returns all the transferable outputs of a $tx._type correctly',
    ({ tx, outs }) => {
      expect(getTransferableOutputsByTx(tx)).toStrictEqual(outs);
    },
  );
});
