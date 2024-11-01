import { testPVMCodec } from '../../fixtures/codec';
import {
  addSubnetValidatorTx,
  addSubnetValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { AddSubnetValidatorTx } from './addSubnetValidatorTx';

testSerialization(
  'AddSubnetValidatorTx',
  AddSubnetValidatorTx,
  addSubnetValidatorTx,
  addSubnetValidatorTxBytes,
  testPVMCodec,
);
