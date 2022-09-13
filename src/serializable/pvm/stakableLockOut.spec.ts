import { testPVMCodec } from '../../fixtures/codec';
import { stakableLockOut, stakableLockOutBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { StakeableLockOut } from './stakableLockOut';

testSerialization(
  'StakableLockOut',
  StakeableLockOut,
  stakableLockOut,
  stakableLockOutBytes,
  testPVMCodec,
);
