import { transferableOp, transferableOpBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { TransferableOp } from './transferableOp';

testSerialization(
  'TransferableOp',
  TransferableOp,
  transferableOp,
  transferableOpBytes,
);
