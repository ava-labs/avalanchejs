import { testPVMCodec } from '../../../fixtures/codec';
import { l1Validator, l1ValidatorBytes } from '../../../fixtures/pvm';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { L1Validator } from './L1Validator';

testSerialization(
  'L1Validator',
  L1Validator,
  l1Validator,
  l1ValidatorBytes,
  testPVMCodec,
);
