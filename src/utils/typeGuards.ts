import type { Serializable } from '../serializable/common/types';
import type { TransferInput } from '../serializable/fxs/secp256k1';
import { transferInputType } from '../serializable/fxs/secp256k1/transferInput';
import type { TransferOutput } from '../serializable/fxs/secp256k1/transferOutput';
import { transferOutput_symbol } from '../serializable/fxs/secp256k1/transferOutput';
import type { StakeableLockIn } from '../serializable/pvm';
import { stakeableLockIn_symbol } from '../serializable/pvm/stakableLockIn';
import type { StakeableLockOut } from '../serializable/pvm/stakableLockOut';
import { stakeableLockOut_symbol } from '../serializable/pvm/stakableLockOut';

export function isTransferOut(out: Serializable): out is TransferOutput {
  return out._type === transferOutput_symbol;
}

export function isStakeableLockOut(out: Serializable): out is StakeableLockOut {
  return out._type === stakeableLockOut_symbol;
}

export function isStakeableLockIn(out: Serializable): out is StakeableLockIn {
  return out._type === stakeableLockIn_symbol;
}

export function isTransferInput(inp: Serializable): inp is TransferInput {
  return inp._type === transferInputType;
}
