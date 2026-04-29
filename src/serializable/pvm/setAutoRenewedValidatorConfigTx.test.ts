import { testPVMCodec } from '../../fixtures/codec';
import {
  setAutoRenewedValidatorConfigTx,
  setAutoRenewedValidatorConfigTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { SetAutoRenewedValidatorConfigTx } from './setAutoRenewedValidatorConfigTx';

testSerialization(
  'SetAutoRenewedValidatorConfigTx',
  SetAutoRenewedValidatorConfigTx,
  setAutoRenewedValidatorConfigTx,
  setAutoRenewedValidatorConfigTxBytes,
  testPVMCodec,
);
