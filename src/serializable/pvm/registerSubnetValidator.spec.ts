import { RegisterSubnetValidator } from './registerSubnetValidator';
import { testSerialization } from '../../fixtures/utils/serializable';
import {
  registerSubnetValidatorBytes,
  registerSubnetValidator,
} from '../../fixtures/pvm';
import { testPVMCodec } from '../../fixtures/codec';

testSerialization(
  'RegisterSubnetValidator',
  RegisterSubnetValidator,
  registerSubnetValidator,
  registerSubnetValidatorBytes,
  testPVMCodec,
);
