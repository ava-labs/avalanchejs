import { testPVMCodec } from '../../fixtures/codec';
import {
  setL1ValidatorWeightTx,
  setL1ValidatorWeightTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { SetL1ValidatorWeightTx } from './setL1ValidatorWeightTx';

testSerialization(
  'SetL1ValidatorWeightTx',
  SetL1ValidatorWeightTx,
  setL1ValidatorWeightTx,
  setL1ValidatorWeightTxBytes,
  testPVMCodec,
);
