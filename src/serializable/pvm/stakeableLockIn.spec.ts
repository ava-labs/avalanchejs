import { testPVMCodec } from '../../fixtures/codec';
import { stakeableLockIn, stakeableLockInBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { StakeableLockIn } from './stakeableLockIn';

testSerialization(
  'StakeableLockIn',
  StakeableLockIn,
  stakeableLockIn,
  stakeableLockInBytes,
  testPVMCodec,
);
