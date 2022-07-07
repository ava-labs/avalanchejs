import { testPVMCodec } from '../../fixtures/codec';
import { stakableLockOut, stakableLockOutBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { StakableLockOut } from './stakableLockOut';

testSerialization(
  'StakableLockOut',
  StakableLockOut,
  stakableLockOut,
  stakableLockOutBytes,
  testPVMCodec,
);
