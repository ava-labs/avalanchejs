import type { Serializable } from '../serializable/common/types';
import type { TransferInput } from '../serializable/fxs/secp256k1';
import type { MintOutput as SecpMintOutput } from '../serializable/fxs/secp256k1/mintOutput';
import type { OutputOwners } from '../serializable/fxs/secp256k1/outputOwners';
import type { TransferOutput } from '../serializable/fxs/secp256k1/transferOutput';
import type { MintOutput as NftMintOutput } from '../serializable/fxs/nft/mintOutput';
import type { TransferOutput as NftTransferOutput } from '../serializable/fxs/nft/transferOutput';
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

export function isNftTransferOut(out: Serializable): out is NftTransferOutput {
  return out._type === TypeSymbols.NftFxTransferOutput;
}

export function isNftMintOut(out: Serializable): out is NftMintOutput {
  return out._type === TypeSymbols.NftFxMintOutput;
}

export function isSecpMintOut(out: Serializable): out is SecpMintOutput {
  return out._type === TypeSymbols.SecpMintOutput;
}

export function isStakeableLockIn(out: Serializable): out is StakeableLockIn {
  return out._type === TypeSymbols.StakeableLockIn;
}

export function isTransferInput(inp: Serializable): inp is TransferInput {
  return inp._type === TypeSymbols.TransferInput;
}
