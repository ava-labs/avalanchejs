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
import { StakableLockIn } from './stakableLockIn';
import { StakableLockOut } from './stakableLockOut';

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

  CreateChainTx, // TODO: 15
  CreateSubnetTx, // TODO: 16

  ImportTx, // 17
  ExportTx, // 18

  AdvanceTimeTx, //19
  RewardValidatorTx, //20

  StakableLockIn, // 21
  StakableLockOut, // 22
]);

let manager: Manager;
export const getPVMManager = () => {
  if (manager) return manager;
  manager = new Manager();
  manager.RegisterCodec(0, codec);
  return manager;
};
