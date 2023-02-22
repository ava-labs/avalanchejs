import { BaseTx } from '../avax/baseTx';
import { Codec, Manager } from '../codec';
import * as Secp256k1Fx from '../fxs/secp256k1';
import { AddDelegatorTx } from './addDelegatorTx';
import { AddSubnetValidatorTx } from './addSubnetValidatorTx';
import { AddValidatorTx } from './addValidatorTx';
import { AdvanceTimeTx } from './advanceTimeTx';
import { CreateChainTx } from './createChainTx';
import { CreateSubnetTx } from './createSubnetTx';
import { ExportTx } from './exportTx';
import { ImportTx } from './importTx';
import { RewardValidatorTx } from './rewardValidatorTx';
import { StakeableLockIn } from './stakableLockIn';
import { StakeableLockOut } from './stakableLockOut';
import { AddPermissionlessValidatorTx } from './addPermissionlessValidatorTx';
import { AddPermissionlessDelegatorTx } from './addPermissionlessDelegatorTx';
import { Signer, SignerEmpty } from './signer';

// https://github.com/ava-labs/avalanchego/blob/master/vms/platformvm/codec.go
export const codec = new Codec([
  BaseTx, // TODO: ProposalBlock // 0
  undefined, // TODO: AbortBlock // 1
  undefined, // TODO: CommitBlock // 2
  undefined, // TODO: StandardBlock // 3
  undefined, // TODO: AtomicBlock // 4

  ...Secp256k1Fx.TypeRegistry, // 5-9
  Secp256k1Fx.Input, // 10
  Secp256k1Fx.OutputOwners, //11

  AddValidatorTx, // 12
  AddSubnetValidatorTx, // 13
  AddDelegatorTx, // 14

  CreateChainTx, // 15
  CreateSubnetTx, // 16

  ImportTx, // 17
  ExportTx, // 18

  AdvanceTimeTx, //19
  RewardValidatorTx, //20

  StakeableLockIn, // 21
  StakeableLockOut, // 22

  undefined, // TODO: RemoveSubnetValidatorTx // 23
  undefined, // TODO: TransformSubnetTx // 24
  AddPermissionlessValidatorTx, //  25
  AddPermissionlessDelegatorTx, // 26

  SignerEmpty, // 27
  Signer, // 28
]);

let manager: Manager;
export const getPVMManager = () => {
  if (manager) return manager;
  manager = new Manager();
  manager.RegisterCodec(0, codec);
  return manager;
};
