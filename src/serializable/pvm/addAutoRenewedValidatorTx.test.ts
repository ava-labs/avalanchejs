import { testPVMCodec } from '../../fixtures/codec';
import {
  addAutoRenewedValidatorTx,
  addAutoRenewedValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { AddAutoRenewedValidatorTx } from './addAutoRenewedValidatorTx';

testSerialization(
  'AddAutoRenewedValidatorTx',
  AddAutoRenewedValidatorTx,
  addAutoRenewedValidatorTx,
  addAutoRenewedValidatorTxBytes,
  testPVMCodec,
);
