import { TransferableInput } from '.';
import { describe, it, expect } from 'vitest';

import {
  transferableInput,
  transferableInputBytes,
  utxoId,
} from '../../fixtures/avax';
import { id } from '../../fixtures/common';
import { bigIntPr } from '../../fixtures/primitives';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Input, TransferInput } from '../fxs/secp256k1';
import { StakeableLockIn } from '../pvm';

testSerialization(
  'TransferableInput',
  TransferableInput,
  transferableInput,
  transferableInputBytes,
);

describe('TransferableInput sorting', () => {
  it('sorts correctly', () => {
    const inputs = [
      {
        utxoID: {
          txID: '2iCGnbjjeZQhqq5jcjqJg4ZxgAbYy92HZtUyPY7abXGwiMvxSg',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '2000000000',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
      {
        utxoID: {
          txID: '2MpCHQEVzMS5AhyXLJxmLT5SoiTV1GxVFBhVxkPXbuoHEKva9Z',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '10000000',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
      {
        utxoID: {
          txID: '2p2cZ6pnszaQjrCYVisq432aQZFnhXsMdtSn3L5azUUAXw4ZRE',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '97000000',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
      {
        utxoID: {
          txID: 'nrZ6vSw6fU8K6WTPeBJBXoTU8rcbViVbPi45ZW4yLtD6v3K6y',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '1971075188',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
    ];
    const inputTransferableInputs = inputs.map((inp) =>
      TransferableInput.fromNative(
        inp.utxoID.txID,
        inp.utxoID.outputIdx,
        inp.assetId,
        BigInt(inp.input.amt.bigint),
        inp.input.input.sigIndices,
      ),
    );

    const expected = [
      {
        utxoID: {
          txID: 'nrZ6vSw6fU8K6WTPeBJBXoTU8rcbViVbPi45ZW4yLtD6v3K6y',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '1971075188',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
      {
        utxoID: {
          txID: '2MpCHQEVzMS5AhyXLJxmLT5SoiTV1GxVFBhVxkPXbuoHEKva9Z',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '10000000',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
      {
        utxoID: {
          txID: '2iCGnbjjeZQhqq5jcjqJg4ZxgAbYy92HZtUyPY7abXGwiMvxSg',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '2000000000',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
      {
        utxoID: {
          txID: '2p2cZ6pnszaQjrCYVisq432aQZFnhXsMdtSn3L5azUUAXw4ZRE',
          outputIdx: 0,
        },
        assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
        input: {
          amt: {
            bigint: '97000000',
          },
          input: {
            sigIndices: [0],
          },
        },
      },
    ];

    const expectedTransferableInputs = expected.map((inp) =>
      TransferableInput.fromNative(
        inp.utxoID.txID,
        inp.utxoID.outputIdx,
        inp.assetId,
        BigInt(inp.input.amt.bigint),
        inp.input.input.sigIndices,
      ),
    );

    inputTransferableInputs.sort(TransferableInput.compare);

    expect(inputTransferableInputs).toStrictEqual(expectedTransferableInputs);
  });
});

describe('sigindicies', () => {
  it('gets sigindicies for transferinput', () => {
    const transferableInputWithTransferInput = new TransferableInput(
      utxoId(),
      id(),
      new TransferInput(bigIntPr(), Input.fromNative([0, 1])),
    );

    expect(transferableInputWithTransferInput.sigIndicies()).toEqual([0, 1]);
  });

  it('gets sigindicies for stakeableLockIn', () => {
    const transferableInputWithTransferInput = new TransferableInput(
      utxoId(),
      id(),
      new StakeableLockIn(
        bigIntPr(),
        new TransferInput(bigIntPr(), Input.fromNative([0, 1])),
      ),
    );

    expect(transferableInputWithTransferInput.sigIndicies()).toEqual([0, 1]);
  });
});
