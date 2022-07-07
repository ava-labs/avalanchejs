import {
  transferableOutput,
  transferableOutputBytes,
} from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { TransferableOutput } from './transferableOutput';

testSerialization(
  'TransferableInput',
  TransferableOutput,
  transferableOutput,
  transferableOutputBytes,
);
