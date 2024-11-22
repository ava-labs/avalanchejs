import { testPVMCodec } from '../../fixtures/codec';
import { validator, validatorBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { Validator } from './validator';

testSerialization(
  'Validator',
  Validator,
  validator,
  validatorBytes,
  testPVMCodec,
);
