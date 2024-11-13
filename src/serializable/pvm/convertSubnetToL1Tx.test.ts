import { testPVMCodec } from '../../fixtures/codec';
import {
  convertSubnetToL1Tx,
  convertSubnetToL1TxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { ConvertSubnetToL1Tx } from './convertSubnetToL1Tx';

testSerialization(
  'ConvertSubnetToL1Tx',
  ConvertSubnetToL1Tx,
  convertSubnetToL1Tx,
  convertSubnetToL1TxBytes,
  testPVMCodec,
);
