import { createAssetTx, createAssetTxBytes } from '../../fixtures/avax';
import { testSerialization } from '../../fixtures/utils/serializable';
import { CreateAssetTx } from './createAssetTx';

testSerialization(
  'CreateAssetTx',
  CreateAssetTx,
  createAssetTx,
  createAssetTxBytes,
);
