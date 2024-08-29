import {
  BigIntPr,
  Int,
  OutputOwners,
  TransferOutput,
} from '../../../serializable';
import { StakeableLockOut } from '../../../serializable/pvm';
import type { Serializable } from '../../common/types';
import { unwrapOutput } from './spend';

describe('./src/vms/pvm/etna-builder/spend.test.ts', () => {
  describe('unwrapOutput', () => {
    const normalOutput = new TransferOutput(
      new BigIntPr(123n),
      new OutputOwners(new BigIntPr(456n), new Int(1), []),
    );

    test.each([
      {
        name: 'normal output',
        testOutput: normalOutput,
        expectedOutput: normalOutput,
        expectedLocktime: 0n,
        expectedError: null,
      },
      {
        name: 'locked output',
        testOutput: new StakeableLockOut(new BigIntPr(789n), normalOutput),
        expectedOutput: normalOutput,
        expectedLocktime: 789n,
        expectedError: null,
      },
      {
        name: 'locked output with no locktime',
        testOutput: new StakeableLockOut(new BigIntPr(0n), normalOutput),
        expectedOutput: normalOutput,
        expectedLocktime: 0n,
        expectedError: null,
      },
      {
        name: 'invalid output',
        testOutput: null as unknown as Serializable,
        expectedOutput: null,
        expectedLocktime: null,
        expectedError: expect.any(Error),
      },
    ])(
      `$name`,
      ({ testOutput, expectedOutput, expectedLocktime, expectedError }) => {
        const [error, output, locktime] = unwrapOutput(testOutput);

        expect(error).toEqual(expectedError);
        expect(output).toEqual(expectedOutput);
        expect(locktime).toEqual(expectedLocktime);
      },
    );
  });
});
