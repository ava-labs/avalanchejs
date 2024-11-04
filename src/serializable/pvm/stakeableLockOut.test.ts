import { testPVMCodec } from '../../fixtures/codec';
import { stakeableLockOut, stakeableLockOutBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { StakeableLockOut } from './stakeableLockOut';

testSerialization(
  'StakeableLockOut',
  StakeableLockOut,
  stakeableLockOut,
  stakeableLockOutBytes,
  testPVMCodec,
);
