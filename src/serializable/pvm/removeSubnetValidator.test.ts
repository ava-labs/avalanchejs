import { RemoveSubnetValidatorTx } from './removeSubnetValidatorTx';
import { testSerialization } from '../../fixtures/utils/serializable';
import {
  removeSubnetValidatorTxBytes,
  removeValidatorTx,
} from '../../fixtures/pvm';
import { testPVMCodec } from '../../fixtures/codec';

testSerialization(
  'RemoveSubnetValidator',
  RemoveSubnetValidatorTx,
  removeValidatorTx,
  removeSubnetValidatorTxBytes,
  testPVMCodec,
);
