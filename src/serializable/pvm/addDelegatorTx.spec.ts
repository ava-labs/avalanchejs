import { testPVMCodec } from '../../fixtures/codec';
import { addDelegatorTx, addDelegatorTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { AddDelegatorTx } from './addDelegatorTx';

testSerialization(
  'AddDelegatorTx',
  AddDelegatorTx,
  addDelegatorTx,
  addDelegatorTxBytes,
  testPVMCodec,
);
