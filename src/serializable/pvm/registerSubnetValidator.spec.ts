import { testPVMCodec } from '../../fixtures/codec';
import {
  registerSubnetValidatorTx,
  registerSubnetValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { RegisterSubnetValidatorTx } from './registerSubnetValidatorTx';

testSerialization(
  'RegisterSubnetValidatorTx',
  RegisterSubnetValidatorTx,
  registerSubnetValidatorTx,
  registerSubnetValidatorTxBytes,
  testPVMCodec,
);
