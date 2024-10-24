import { testPVMCodec } from '../../fixtures/codec';
import { increaseBalanceTx, increaseBalanceTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { IncreaseBalanceTx } from './increaseBalanceTx';

testSerialization(
  'IncreaseBalanceTx',
  IncreaseBalanceTx,
  increaseBalanceTx,
  increaseBalanceTxBytes,
  testPVMCodec,
);
