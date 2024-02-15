import { testPVMCodec } from '../../fixtures/codec';
import {
  addPermissionlessValidatorTx,
  addPermissionlessValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { AddPermissionlessValidatorTx } from './addPermissionlessValidatorTx';

testSerialization(
  'AddPermissionlessValidatorTx',
  AddPermissionlessValidatorTx,
  addPermissionlessValidatorTx,
  addPermissionlessValidatorTxBytes,
  testPVMCodec,
);
