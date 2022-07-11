import type { Serializable } from '../serializable/common/types';
import type { TransferOutput } from '../serializable/fxs/secp256k1/transferOutput';
import { transferOutput_symbol } from '../serializable/fxs/secp256k1/transferOutput';
import type { StakableLockOut } from '../serializable/pvm/stakableLockOut';
import { stakeableLockOut_symbol } from '../serializable/pvm/stakableLockOut';

export function isTransferOut(out: Serializable): out is TransferOutput {
  return out._type === transferOutput_symbol;
}

export function isStakeableLockOut(out: Serializable): out is StakableLockOut {
  return out._type === stakeableLockOut_symbol;
}
