import { TransferOutput } from '.';
import {
  transferOutput,
  transferOutputBytes,
} from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization(
  'TransferOutput',
  TransferOutput,
  transferOutput,
  transferOutputBytes,
);
