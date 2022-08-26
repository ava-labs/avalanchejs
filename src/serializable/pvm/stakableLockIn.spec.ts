import { testPVMCodec } from '../../fixtures/codec';
import { stakableLockIn, stakableLockInBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { StakeableLockIn } from './stakableLockIn';

testSerialization(
  'StakableLockIn',
  StakeableLockIn,
  stakableLockIn,
  stakableLockInBytes,
  testPVMCodec,
);
