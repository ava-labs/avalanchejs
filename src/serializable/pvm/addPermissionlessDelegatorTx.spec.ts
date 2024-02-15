import { testPVMCodec } from '../../fixtures/codec';
import {
  addPermissionlessDelegatorTx,
  addPermissionlessDelegatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { AddPermissionlessDelegatorTx } from './addPermissionlessDelegatorTx';

testSerialization(
  'AddPermissionlessDelegatorTx',
  AddPermissionlessDelegatorTx,
  addPermissionlessDelegatorTx,
  addPermissionlessDelegatorTxBytes,
  testPVMCodec,
);
