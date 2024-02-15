import { MintOperation } from '.';
import { mintOperation, mintOperationBytes } from '../../../fixtures/secp256k1';
import { testSerialization } from '../../../fixtures/utils/serializable';

testSerialization(
  'MintOperation',
  MintOperation,
  mintOperation,
  mintOperationBytes,
);
