import { testPVMCodec } from '../../fixtures/codec';
import { stakableLockIn, stakableLockInBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { StakableLockIn } from './stakableLockIn';

testSerialization(
  'StakableLockIn',
  StakableLockIn,
  stakableLockIn,
  stakableLockInBytes,
  testPVMCodec,
);
