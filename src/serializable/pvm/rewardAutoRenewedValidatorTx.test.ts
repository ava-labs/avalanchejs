import { testPVMCodec } from '../../fixtures/codec';
import {
  rewardAutoRenewedValidatorTx,
  rewardAutoRenewedValidatorTxBytes,
} from '../../fixtures/pvm';
import { testSerialization } from '../../fixtures/utils/serializable';
import { RewardAutoRenewedValidatorTx } from './rewardAutoRenewedValidatorTx';

testSerialization(
  'RewardAutoRenewedValidatorTx',
  RewardAutoRenewedValidatorTx,
  rewardAutoRenewedValidatorTx,
  rewardAutoRenewedValidatorTxBytes,
  testPVMCodec,
);
