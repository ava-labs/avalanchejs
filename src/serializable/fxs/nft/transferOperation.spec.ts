import {
  transferOperation,
  transferOperationBytes,
} from '../../../fixtures/nft';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { TransferOperation } from './transferOperation';

testSerialization(
  'TransferOperation',
  TransferOperation,
  transferOperation,
  transferOperationBytes,
);
