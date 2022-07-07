import { TransferInput } from '.';
import { transferInput, transferInputBytes } from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization(
  'TransferInput',
  TransferInput,
  transferInput,
  transferInputBytes,
);
