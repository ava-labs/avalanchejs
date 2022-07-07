import { testPVMCodec } from '../../fixtures/codec';
import { createSubnetTx, createSubnetTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { CreateSubnetTx } from './createSubnetTx';

testSerialization(
  'CreateSubnetTx',
  CreateSubnetTx,
  createSubnetTx,
  createSubnetTxBytes,
  testPVMCodec,
);
