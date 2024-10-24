import { RegisterSubnetValidatorTx } from './registerSubnetValidatorTx';
import { testSerialization } from '../../fixtures/utils/serializable';
import {
  registerSubnetValidatorTxBytes,
  registerSubnetValidatorTx,
} from '../../fixtures/pvm';
import { testPVMCodec } from '../../fixtures/codec';

testSerialization(
  'RegisterSubnetValidatorTx',
  RegisterSubnetValidatorTx,
  registerSubnetValidatorTx,
  registerSubnetValidatorTxBytes,
  testPVMCodec,
);
