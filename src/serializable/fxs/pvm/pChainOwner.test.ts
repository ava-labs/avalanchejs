import { testPVMCodec } from '../../../fixtures/codec';
import { pChainOwner, pChainOwnerBytes } from '../../../fixtures/pvm';
import { testSerialization } from '../../../fixtures/utils/serializable';
import { PChainOwner } from './pChainOwner';

testSerialization(
  'PChainOwner',
  PChainOwner,
  pChainOwner,
  pChainOwnerBytes,
  testPVMCodec,
);
