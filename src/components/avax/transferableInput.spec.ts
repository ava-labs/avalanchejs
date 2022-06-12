import { TransferableInput } from '.';
import { transferableInput, transferableInputBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';

testSerialization(
  'TransferableInput',
  TransferableInput,
  transferableInput,
  transferableInputBytes,
);
