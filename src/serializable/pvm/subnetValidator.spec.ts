import { testPVMCodec } from '../../fixtures/codec';
import { subnetValidator, subnetValidatorBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { SubnetValidator } from './subnetValidator';

testSerialization(
  'SubnetValidator',
  SubnetValidator,
  subnetValidator,
  subnetValidatorBytes,
  testPVMCodec,
);
