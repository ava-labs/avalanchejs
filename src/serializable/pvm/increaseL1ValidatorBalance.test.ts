import { testPVMCodec } from '../../fixtures/codec';
import {
  increaseL1ValidatorBalanceTx,
  increaseL1ValidatorBalanceTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { IncreaseL1ValidatorBalanceTx } from './increaseL1ValidatorBalanceTx';

testSerialization(
  'IncreaseL1ValidatorBalanceTx',
  IncreaseL1ValidatorBalanceTx,
  increaseL1ValidatorBalanceTx,
  increaseL1ValidatorBalanceTxBytes,
  testPVMCodec,
);
