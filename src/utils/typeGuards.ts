import type { Serializable } from '../serializable/common/types';
import type { TransferInput } from '../serializable/fxs/secp256k1';
import type { OutputOwners } from '../serializable/fxs/secp256k1/outputOwners';
import type { TransferOutput } from '../serializable/fxs/secp256k1/transferOutput';
import type { StakeableLockIn } from '../serializable/pvm/stakeableLockIn';
import type { StakeableLockOut } from '../serializable/pvm/stakeableLockOut';
import { TypeSymbols } from '../serializable/constants';

export function isTransferOut(out: Serializable): out is TransferOutput {
  return out._type === TypeSymbols.TransferOutput;
}

export function isStakeableLockOut(out: Serializable): out is StakeableLockOut {
  return out._type === TypeSymbols.StakeableLockOut;
}

export function isRewardsOwner(out: Serializable): out is OutputOwners {
  return out._type === TypeSymbols.OutputOwners;
}

export function isStakeableLockIn(out: Serializable): out is StakeableLockIn {
  return out._type === TypeSymbols.StakeableLockIn;
}

export function isTransferInput(inp: Serializable): inp is TransferInput {
  return inp._type === TypeSymbols.TransferInput;
}
