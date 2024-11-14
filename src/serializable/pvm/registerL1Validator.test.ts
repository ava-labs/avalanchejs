import { testPVMCodec } from '../../fixtures/codec';
import {
  registerL1ValidatorTx,
  registerL1ValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { RegisterL1ValidatorTx } from './registerL1ValidatorTx';

testSerialization(
  'RegisterL1ValidatorTx',
  RegisterL1ValidatorTx,
  registerL1ValidatorTx,
  registerL1ValidatorTxBytes,
  testPVMCodec,
);
