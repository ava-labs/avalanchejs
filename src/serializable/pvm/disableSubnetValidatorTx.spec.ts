import { testPVMCodec } from '../../fixtures/codec';
import {
  disableSubnetValidatorTx,
  disableSubnetValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { DisableSubnetValidatorTx } from './disableSubnetValidatorTx';

testSerialization(
  'DisableSubnetValidatorTx',
  DisableSubnetValidatorTx,
  disableSubnetValidatorTx,
  disableSubnetValidatorTxBytes,
  testPVMCodec,
);
