import { testPVMCodec } from '../../fixtures/codec';
import { transformSubnetTx, transformSubnetTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { TransformSubnetTx } from './transformSubnetTx';

testSerialization(
  'TransformSubnetTx',
  TransformSubnetTx,
  transformSubnetTx,
  transformSubnetTxBytes,
  testPVMCodec,
);
