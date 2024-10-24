import { testPVMCodec } from '../../fixtures/codec';
import { convertSubnetTx, convertSubnetTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ConvertSubnetTx } from './convertSubnetTx';

testSerialization(
  'ConvertSubnetTx',
  ConvertSubnetTx,
  convertSubnetTx,
  convertSubnetTxBytes,
  testPVMCodec,
);
