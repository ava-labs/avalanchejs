import { TransferOutput } from '.';
import { transferOutput, transferOutputBytes } from '../../../fixtures/nft';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization(
  'TransferOutput',
  TransferOutput,
  transferOutput,
  transferOutputBytes,
);
