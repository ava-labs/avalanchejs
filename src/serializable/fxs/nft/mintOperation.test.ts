import { mintOperation, mintOperationBytes } from '../../../fixtures/nft';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { MintOperation } from './mintOperation';

testSerialization(
  'MintOperation',
  MintOperation,
  mintOperation,
  mintOperationBytes,
);
