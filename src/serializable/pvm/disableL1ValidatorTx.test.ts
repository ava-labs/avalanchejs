import { testPVMCodec } from '../../fixtures/codec';
import {
  disableL1ValidatorTx,
  disableL1ValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { DisableL1ValidatorTx } from './disableL1ValidatorTx';

testSerialization(
  'DisableL1ValidatorTx',
  DisableL1ValidatorTx,
  disableL1ValidatorTx,
  disableL1ValidatorTxBytes,
  testPVMCodec,
);
