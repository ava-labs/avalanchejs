import {
  convertSubnetValidator,
  convertSubnetValidatorBytes,
} from '../../../fixtures/pvm';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { ConvertSubnetValidator } from './convertSubnetValidator';

testSerialization(
  'ConvertSubnetValidator',
  ConvertSubnetValidator,
  convertSubnetValidator,
  convertSubnetValidatorBytes,
);
