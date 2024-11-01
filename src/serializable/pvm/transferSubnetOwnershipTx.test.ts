import { testPVMCodec } from '../../fixtures/codec';
import {
  transferSubnetOwnershipTx,
  transferSubnetOwnershipTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { TransferSubnetOwnershipTx } from './transferSubnetOwnershipTx';

testSerialization(
  'TransferSubnetOwnershipTx',
  TransferSubnetOwnershipTx,
  transferSubnetOwnershipTx,
  transferSubnetOwnershipTxBytes,
  testPVMCodec,
);
