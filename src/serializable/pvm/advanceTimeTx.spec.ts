import { testPVMCodec } from '../../fixtures/codec';
import { advanceTimeBytesTx, advanceTimeTx } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { AdvanceTimeTx } from './advanceTimeTx';

testSerialization(
  'AdvanceTime',
  AdvanceTimeTx,
  advanceTimeTx,
  advanceTimeBytesTx,
  testPVMCodec,
);
