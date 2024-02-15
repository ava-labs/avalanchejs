import { testPVMCodec } from '../../fixtures/codec';
import { createChainTx, createChainTxBytes } from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { CreateChainTx } from './createChainTx';

testSerialization(
  'CreateChainTx',
  CreateChainTx,
  createChainTx,
  createChainTxBytes,
  testPVMCodec,
);
