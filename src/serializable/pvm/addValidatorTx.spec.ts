import { testPVMCodec } from '../../fixtures/codec';
import { addValidatorTx, addValidatorTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { AddValidatorTx } from './addValidatorTx';

testSerialization(
  'AddValidatorTx',
  AddValidatorTx,
  addValidatorTx,
  addValidatorTxBytes,
  testPVMCodec,
);
