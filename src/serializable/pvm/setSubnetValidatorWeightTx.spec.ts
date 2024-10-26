import { testPVMCodec } from '../../fixtures/codec';
import {
  setSubnetValidatorWeightTx,
  setSubnetValidatorWeightTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { SetSubnetValidatorWeightTx } from './setSubnetValidatorWeightTx';

testSerialization(
  'SetSubnetValidatorWeightTx',
  SetSubnetValidatorWeightTx,
  setSubnetValidatorWeightTx,
  setSubnetValidatorWeightTxBytes,
  testPVMCodec,
);
